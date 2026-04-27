# vulnerabilities/management/commands/import_nvd.py

import json
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime
from vulnerabilities.models import CVEEntry

NVD_DATA_DIR = '/app/vulnerabilities/data/nvd'


def parse_severity(score):
    if score is None:
        return 'unknown'
    if score < 2.0:
        return 'info'
    
    if score < 4.0:
        return 'low'
    if score < 7.0:
        return 'medium'
    if score < 9.0:
        return 'high'
    return 'critical'


def extract_cve(item):
    """Extrait les champs utiles d'un item NVD 2.0."""
    cve = item.get('cve', {})
    cve_id = cve.get('id', '')
    if not cve_id:
        return None

    # Description (anglais en priorité)
    descriptions = cve.get('descriptions', [])
    description = next(
        (d['value'] for d in descriptions if d.get('lang') == 'en'),
        descriptions[0]['value'] if descriptions else ''
    )

    # Dates
    published = parse_datetime(cve.get('published', '')) if cve.get('published') else None
    last_modified = parse_datetime(cve.get('lastModified', '')) if cve.get('lastModified') else None

    # CVSS v3
    cvss_v3_score = None
    cvss_v3_vector = ''
    cvss_v3_severity = 'unknown'

    metrics = cve.get('metrics', {})

    for key in ['cvssMetricV31', 'cvssMetricV30']:
        if key in metrics and metrics[key]:
            m = metrics[key][0].get('cvssData', {})
            cvss_v3_score = m.get('baseScore')
            cvss_v3_vector = m.get('vectorString', '')
            cvss_v3_severity = m.get('baseSeverity', parse_severity(cvss_v3_score)).lower()
            break

    # CVSS v2
    cvss_v2_score = None
    cvss_v2_severity = ''
    if 'cvssMetricV2' in metrics and metrics['cvssMetricV2']:
        m = metrics['cvssMetricV2'][0].get('cvssData', {})
        cvss_v2_score = m.get('baseScore')
        cvss_v2_severity = metrics['cvssMetricV2'][0].get('baseSeverity', '').lower()

    # CWE
    weaknesses = cve.get('weaknesses', [])
    cwe_ids = ';'.join(
        d['value'] for w in weaknesses
        for d in w.get('description', [])
        if d.get('value', '').startswith('CWE-')
    )

    # CPE produits affectés
    configs = cve.get('configurations', [])
    cpes = []
    for config in configs:
        for node in config.get('nodes', []):
            for match in node.get('cpeMatch', []):
                cpe = match.get('criteria', '')
                if cpe:
                    cpes.append(cpe)
    affected_products = '\n'.join(cpes[:20])  # limite à 20 CPE

    # Références
    refs = cve.get('references', [])
    references = '\n'.join(r.get('url', '') for r in refs[:10])

    return {
        'cve_id': cve_id,
        'description': description,
        'published': published,
        'last_modified': last_modified,
        'cvss_v3_score': cvss_v3_score,
        'cvss_v3_vector': cvss_v3_vector,
        'cvss_v3_severity': cvss_v3_severity,
        'cvss_v2_score': cvss_v2_score,
        'cvss_v2_severity': cvss_v2_severity,
        'cwe_ids': cwe_ids,
        'affected_products': affected_products,
        'references': references,
    }


class Command(BaseCommand):
    help = 'Importe les CVE NVD depuis les fichiers JSON (2002-2026)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=int,
            help='Importer uniquement une année spécifique (ex: --year 2024)',
        )
        parser.add_argument(
            '--chunk',
            type=int,
            default=500,
            help='Taille des chunks pour bulk_create (défaut: 500)',
        )

    def handle(self, *args, **options):
        year_filter = options.get('year')
        chunk_size = options.get('chunk')

        files = sorted(os.listdir(NVD_DATA_DIR))

        if year_filter:
            files = [f for f in files if str(year_filter) in f]

        if not files:
            self.stdout.write(self.style.ERROR('Aucun fichier JSON trouvé.'))
            return

        total_created = 0
        total_updated = 0
        total_errors = 0

        for filename in files:
            if not filename.endswith('.json'):
                continue

            filepath = os.path.join(NVD_DATA_DIR, filename)
            self.stdout.write(f'\n📂 Traitement : {filename}')

            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ Erreur lecture : {e}'))
                continue

            items = data.get('vulnerabilities', [])
            self.stdout.write(f'  → {len(items)} CVE trouvés')

            # Récupérer les CVE IDs déjà en base pour ce fichier (optimisation)
            batch_cve_ids = []
            parsed_items = []

            for item in items:
                extracted = extract_cve(item)
                if extracted:
                    batch_cve_ids.append(extracted['cve_id'])
                    parsed_items.append(extracted)

            existing_ids = set(
                CVEEntry.objects.filter(cve_id__in=batch_cve_ids)
                .values_list('cve_id', flat=True)
            )

            to_create = []
            to_update = []

            for data_item in parsed_items:
                if data_item['cve_id'] in existing_ids:
                    to_update.append(data_item)
                else:
                    to_create.append(CVEEntry(**data_item))

            # Bulk create par chunks
            created = 0
            for i in range(0, len(to_create), chunk_size):
                chunk = to_create[i:i + chunk_size]
                try:
                    CVEEntry.objects.bulk_create(chunk, ignore_conflicts=True)
                    created += len(chunk)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  ❌ Erreur bulk_create chunk {i}: {e}'))
                    total_errors += len(chunk)

            # Update un par un (pas de bulk_update pour éviter les conflits)
            updated = 0
            for item_data in to_update:
                try:
                    CVEEntry.objects.filter(cve_id=item_data['cve_id']).update(**{
                        k: v for k, v in item_data.items() if k != 'cve_id'
                    })
                    updated += 1
                except Exception as e:
                    total_errors += 1

            total_created += created
            total_updated += updated

            self.stdout.write(
                self.style.SUCCESS(f'  ✅ {created} créés, {updated} mis à jour')
            )

        self.stdout.write(self.style.SUCCESS(
            f'\n🎉 Import terminé — {total_created} créés, {total_updated} mis à jour, {total_errors} erreurs'
        ))