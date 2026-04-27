// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { Shield, Users, Activity, AlertTriangle, Trash2, ArrowUpDown, Loader2, PlusCircle, MessageCircle } from 'lucide-react';
import { PlatformLayout } from '@/components/platform-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Chat, { ChatMessage } from '@/components/chat';
import api from '@/lib/api';
import StatsPanel from '@/components/statpannel';

type Metrics = {
  users: number;
  scans: number;
  vulnerabilities: number;
  alerts: number;
};

type Scan = {
  scan_id: string;
  name: string;
  target: string;
  permanent_scan: any[];
  user: any[];
  begin_at: string;
  end_at: string;
  status: string;
  scan_type: string;
  vulnerabilities: any[];
};

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<Metrics>();
  const [scans, setScans] = useState<Scan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingScans, setLoadingScans] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sortKey, setSortKey] = useState<'name' | 'target' | 'user' | 'vulnerabilities' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllScans, setShowAllScans] = useState(false);

  /* ------------------ CHAT STATE ------------------ */
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const router = useRouter();

  /* ------------------ CHAT FUNCTIONS ------------------ */
  const sendChatMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      console.log('Sending message to chat API:', { message });
      const response = await api.post('ia/chat/', {
        message,
        query : message,
        context: {
          userId: currentUser?.id,
          role: currentUser?.role,
          timestamp: new Date().toISOString()
        }
      });

      console.log('Chat API response:', response.data);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || response.data.message || 'No response from assistant',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.log('Chat API error details:', error.response?.data || error.message || error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.response?.data?.error || error.message || 'Failed to get response'}`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Chat Error',
        description: error.response?.data?.error || 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  /* ------------------ LOAD DATA ------------------ */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const reponse = await api.get("user/me/");
        setCurrentUser(reponse.data);
      } catch (err) {
        console.error(err);
      }
    };

    const loadMetrics = async () => {
      if (currentUser?.role !== 'admin') return;
      try {
        const res = await api.get('admin/metrics/');
        setMetrics(res.data);
      } catch (err) {
        toast({ title: 'Failed to load metrics', variant: 'destructive' });
      } finally {
        setLoadingMetrics(false);
      }
    };

    const loadScans = async () => {
      try {
        const url = currentUser?.role === 'admin' ? 'admin/scans/' : 'scans/status/';
        const res = await api.get(url);
        setScans(res.data);
      } catch (err) {
        toast({ title: 'Failed to load scans', variant: 'destructive' });
      } finally {
        setLoadingScans(false);
      }
    };

    const loadUsers = async () => {
      if (currentUser?.role !== 'admin') return;
      try {
        const res = await api.get('admin/users/');
        setUsers(res.data);
      } catch (err) {
        toast({ title: 'Failed to load users', variant: 'destructive' });
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUser();
    loadMetrics();
    loadScans();
    loadUsers();
  }, [currentUser?.role, toast]);

  /* ------------------ ACTIONS ------------------ */
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`admin/users/${userId}/`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: 'User deleted' });
    } catch {
      toast({ title: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      await api.patch(`admin/users/${userId}/`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Role updated' });
    } catch {
      toast({ title: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm('Are you sure you want to delete this scan?')) return;
    try {
      await api.delete(`admin/scans/${scanId}/`);
      setScans(prev => prev.filter(s => s.scan_id !== scanId));
      toast({ title: 'Scan deleted' });
    } catch {
      toast({ title: 'Failed to delete scan', variant: 'destructive' });
    }
  };

  /* ------------------ SORT FUNCTION ------------------ */
  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const sortedScans = [...scans].sort((a, b) => {
    let valA: any, valB: any;

    switch (sortKey) {
      case 'vulnerabilities':
        valA = a.vulnerabilities?.length || 0;
        valB = b.vulnerabilities?.length || 0;
        break;
      case 'status':
        const order = ['completed', 'running', 'failed'];
        valA = order.indexOf(a.status);
        valB = order.indexOf(b.status);
        break;
      case 'user':
        valA = a.user.username.toLowerCase();
        valB = b.user.username.toLowerCase();
        break;
      default:
        valA = (a as any)[sortKey];
        valB = (b as any)[sortKey];
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  const CHAT_WIDTH = 360;
  const displayedUsers = showAllUsers ? users : users.slice(0, 5);
  const displayedScans = showAllScans ? sortedScans : sortedScans.slice(0, 5);

  /* ------------------ RENDER ------------------ */
  if (!currentUser) return <Loader2 className="animate-spin h-10 w-10 mx-auto mt-20" />;

  return (
    <PlatformLayout>
      <div className="flex h-full relative">
        {/* MAIN CONTENT */}
        <div className={`flex-1 transition-all duration-300`} style={{ marginRight: isChatOpen ? `${CHAT_WIDTH}px` : '0' }}>
          <div className="space-y-6 p-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">{currentUser.role === 'admin' ? 'Admin Security Center' : 'User Dashboard'}</h1>
                <p className="text-muted-foreground">Platform monitoring and actions</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {isChatOpen ? 'Close Chat' : 'AI Secure Chat'}
                </Button>
                {currentUser.role !== 'admin' && (
                  <Button variant="outline" size="sm"
                  
                    onClick={() => router.push('/scan/config')}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> New Scan
                  </Button>
                )}
              </div>
            </div>
            
            <StatsPanel data={scans}/>
            {/* METRICS */}
            {currentUser.role === 'admin' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex justify-between">
                    <CardTitle className="text-sm">Users</CardTitle>
                    <Users className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>{loadingMetrics ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="text-2xl font-bold">{metrics?.users}</div>}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex justify-between">
                    <CardTitle className="text-sm">Total Scans</CardTitle>
                    <Activity className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>{loadingMetrics ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="text-2xl font-bold">{metrics?.scans}</div>}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex justify-between">
                    <CardTitle className="text-sm">Vulnerabilities</CardTitle>
                    <Shield className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>{loadingMetrics ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="text-2xl font-bold">{metrics?.vulnerabilities}</div>}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex justify-between">
                    <CardTitle className="text-sm">Security Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>{loadingMetrics ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="text-2xl font-bold text-red-500">{metrics?.alerts}</div>}</CardContent>
                </Card>
              </div>
            )}
            {/* USERS TABLE */}
            {currentUser.role === 'admin' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Card>
                  <CardHeader><CardTitle>Platform Users</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    {loadingUsers ? <Loader2 className="animate-spin h-5 w-5" /> :
                      <>
                        <table className="w-full table-auto border-collapse">
                          <thead className="bg-base-200">
                            <tr>
                              <th className="p-2 border">#</th>
                              <th className="p-2 border">Username</th>
                              <th className="p-2 border">Email</th>
                              <th className="p-2 border">Role</th>
                              <th className="p-2 border">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedUsers.map((u, idx) => (
                              <tr key={u.id} className="hover:bg-base-100">
                                <td className="p-2 border">{idx + 1}</td>
                                <td className="p-2 border">{u.username}</td>
                                <td className="p-2 border">{u.email}</td>
                                <td className="p-2 border">
                                  <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value)} className="border px-2 py-1 rounded">
                                    <option className="bg-base text-primary" value="analyst">Analyst</option>
                                    <option className="bg-base text-warning" value="auditor">Auditor</option>
                                    <option className='bg-base text-accent' value="admin">Admin</option>
                                  </select>
                                </td>
                                <td className="p-2 border flex gap-2">
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u.id)}><Trash2 className="h-4 w-4" /></Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {users.length > 5 && <Button variant="link" size="sm" onClick={() => setShowAllUsers(!showAllUsers)}>{showAllUsers ? 'Voir moins' : 'Voir tout'}</Button>}
                      </>
                    }
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* SCANS TABLE */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>Platform Scans</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {['name', 'target', 'user', 'vulnerabilities', 'status'].map(k =>
                      <Button key={k} size="sm" onClick={() => handleSort(k as any)} className="btn btn-primary flex items-center gap-1">
                        <ArrowUpDown className="h-4 w-4" /> {k.charAt(0).toUpperCase() + k.slice(1)}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {loadingScans ? <Loader2 className="animate-spin h-5 w-5" /> :
                    <>
                      <table className="w-full table-auto border-collapse">
                        <thead className="bg-base-200">
                          <tr>
                            <th className="p-2 border">#</th>
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Target</th>
                            <th className="p-2 border">User</th>
                            <th className="p-2 border">Type</th>
                            <th className="p-2 border">Vulns</th>
                            <th className="p-2 border">Status</th>
                            {currentUser.role === 'admin' && <th className="p-2 border">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {displayedScans.map((s, idx) => (
                            <tr key={s.scan_id} className="hover:bg-base-100">
                              <td className="p-2 border">{idx + 1}</td>
                              <td className="p-2 border">{s.name}</td>
                              <td className="p-2 border">{s.target}</td>
                              <td className="p-2 border">{s.user?.username || s?.user}</td>
                              <td className="p-2 border">{s.scan_type}</td>
                              <td className="p-2 border">{s.vulnerabilities?.length || 0}</td>
                              <td className="p-2 border">
                                <Badge variant={s.status === 'completed' ? 'success' : s.status === 'running' ? 'secondary' : 'destructive'}>{s.status}</Badge>
                              </td>
                              {currentUser.role === 'admin' &&
                                <td className="p-2 border">
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteScan(s.scan_id)}><Trash2 className="h-4 w-4" /></Button>
                                </td>
                              }
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sortedScans.length > 5 && <Button variant="link" size="sm" onClick={() => setShowAllScans(!showAllScans)}>{showAllScans ? 'Voir moins' : 'Voir tout'}</Button>}
                    </>
                  }
                </CardContent>
              </Card>
            </motion.div>

            {/* USER DASHBOARD ACTIONS */}
            {currentUser.role !== 'admin' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Card>
                  <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                  <CardContent className="space-y-2 flex flex-col md:flex-row gap-2">
                    <Button variant="outline" size="sm" 
                    onClick={() => router.push('/scan/config')}
                    ><PlusCircle className="h-4 w-4 mr-1" /> New Scan</Button>
                    <Button variant="outline" size="sm">View My Scans</Button>
                    <Button variant="outline" size="sm">Download Reports</Button>
                    <Button variant="outline" size="sm">Settings</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChatOpen(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" /> AI Secure Chat
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
        {/* CHAT COMPONENT */}

        <Chat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={sendChatMessage}
        isLoading={isChatLoading}
        initialWidth={CHAT_WIDTH}
        connected={true}
       />

        {/* <ChatMessages */}
          {/* isOpen={isChatOpen} */}
          {/* onClose={() => setIsChatOpen(false)} */}
          {/* messages={chatMessages} */}
          {/* onSendMessage={sendChatMessage} */}
          {/* isLoading={isChatLoading} */}
          {/* initialWidth={320} */}
          {/* minWidth={280} */}
          {/* maxWidth={800} */}
        {/* /> */}
      </div>
    </PlatformLayout>
  );
}