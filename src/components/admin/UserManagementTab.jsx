
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ban, CheckCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for date formatting

const UserManagementTab = ({ users = [], searchTerm, setSearchTerm, handleBanToggle }) => {

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      String(user.telegramId).includes(searchLower) || // Use telegramId
      user.wallet?.toLowerCase().includes(searchLower) // Use wallet
    );
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Ensure it's a Firestore Timestamp before calling toDate()
     if (timestamp instanceof Timestamp) {
       return timestamp.toDate().toLocaleDateString();
     } else if (timestamp.seconds) {
        // Handle cases where it might be a plain object from Firestore
        try {
            return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate().toLocaleDateString();
        } catch (e) { return 'Invalid Date'; }
     }
    return 'Invalid Date';
  };

  return (
     <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View, search, and manage user accounts.</CardDescription>
          <Input
            type="text"
            placeholder="Search by ID, name, username, wallet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm mt-4"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Refs</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'N/A';
                const fallback = (user.firstName || user.username || 'U').substring(0, 1).toUpperCase();
                return (
                  <TableRow key={user.id || user.telegramId} className={user.isBanned ? 'opacity-50 bg-destructive/10' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={user.profilePicUrl || `https://avatar.vercel.sh/${user.username || user.telegramId}.png?size=32`} alt={user.username || user.telegramId} />
                           <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{displayName}</p>
                          <p className="text-xs text-muted-foreground">@{user.username || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{user.telegramId}</TableCell>
                     <TableCell className="text-xs">{formatDate(user.joinedAt)}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {user.wallet ? `${user.wallet.substring(0, 6)}...${user.wallet.substring(user.wallet.length - 4)}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">{user.balance?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">{user.referrals || 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.isBanned ? 'destructive' : 'success'}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </Badge>
                      {user.isAdmin && <Badge variant="secondary" className="ml-1">Admin</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={user.isBanned ? 'outline' : 'destructive'}
                        size="sm"
                        onClick={() => handleBanToggle(user.telegramId, user.isBanned)}
                      >
                        {user.isBanned ? <CheckCircle className="mr-1 h-4 w-4" /> : <Ban className="mr-1 h-4 w-4" />}
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </Button>
                      {/* Add button to toggle admin status here if needed */}
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">No users found matching your search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  );
};

export default UserManagementTab;
  