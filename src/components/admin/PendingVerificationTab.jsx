import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';

const PendingVerificationTab = ({ pendingItems = [], onApprove, onReject }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Manual Verifications</CardTitle>
        <CardDescription>
          Review tasks submitted by users that need manual approval.
        </CardDescription>
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
            {pendingItems.length > 0 ? (
              pendingItems.map((item) => {
                const displayName = item.username || item.firstName || `User ${item.userId}`;
                const isHandle = item.taskTarget?.startsWith('@');
                const isLink = item.taskTarget?.startsWith('http');
                const link = isHandle
                  ? `https://t.me/${item.taskTarget.replace('@', '')}`
                  : isLink
                  ? item.taskTarget
                  : item.taskTarget
                  ? `https://${item.taskTarget}`
                  : null;

                return (
                  <TableRow key={`${item.userId}-${item.taskId}`}>
                    <TableCell className="text-sm font-medium">
                      {displayName}
                    </TableCell>

                    <TableCell className="text-sm">{item.taskTitle}</TableCell>

                    <TableCell className="text-xs max-w-[150px] truncate">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline break-words"
                        >
                          {item.taskTarget}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
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
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No tasks pending manual verification.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PendingVerificationTab;
