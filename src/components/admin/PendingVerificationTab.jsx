
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X } from 'lucide-react';

// Receives pendingItems prepared in AdminPage
const PendingVerificationTab = ({ pendingItems = [], onApprove, onReject }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Manual Verifications</CardTitle>
        <CardDescription>Review tasks submitted by users for manual verification.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingItems.length > 0 ? pendingItems.map((item) => (
              // Use userId and taskId which should be unique for the pending item
              <TableRow key={`${item.userId}-${item.taskId}`}>
                <TableCell className="text-sm">{item.username || item.userId}</TableCell>
                <TableCell className="text-sm font-medium">{item.taskTitle}</TableCell>
                 <TableCell>
                    {item.taskTarget ? (
                        <a
                          href={item.taskTarget.startsWith('@') ? `https://t.me/${item.taskTarget.replace('@','')}` : (item.taskTarget.startsWith('http') ? item.taskTarget : `https://${item.taskTarget}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 break-all hover:underline"
                        >
                           {item.taskTarget}
                        </a>
                    ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                 </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={() => onApprove(item.userId, item.taskId)}
                  >
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onReject(item.userId, item.taskId)}
                  >
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">No tasks pending manual verification.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PendingVerificationTab;
  