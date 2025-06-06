import React, { useState } from 'react';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Wallet, User, Calendar, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PendingWithdrawTab = ({ pendingWithdrawals = [], onApprove, onReject }) => {
  const [processing, setProcessing] = useState({});
  const { toast } = useToast();

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Wallet address copied to clipboard',
        className: 'bg-[#1a1a1a] text-white',
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
        className: 'bg-[#1a1a1a] text-white',
      });
    }
  };

  const stonToTon = (ston) => {
    const amount = parseFloat(ston) || 0;
    return (amount / 10000000).toFixed(6);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const openTonScan = (address) => {
    window.open(`https://tonscan.org/address/${address}`, '_blank');
  };

  const handleApprove = async (withdrawal) => {
    if (!window.confirm(`Approve withdrawal of ${withdrawal.amount} STON (${stonToTon(withdrawal.amount)} TON) for ${withdrawal.username || withdrawal.userId}?`)) {
      return;
    }
    
    setProcessing(prev => ({ ...prev, [withdrawal.id]: 'approving' }));
    
    try {
      await onApprove(withdrawal.id, withdrawal.userId, withdrawal.amount);
      toast({
        title: 'Withdrawal Approved',
        description: `${withdrawal.amount} STON withdrawal approved for ${withdrawal.username || withdrawal.userId}`,
        variant: 'success',
        className: 'bg-[#1a1a1a] text-white',
      });
    } catch (error) {
      console.error(`Error approving withdrawal:`, error);
      toast({
        title: 'Error',
        description: 'Failed to approve withdrawal',
        variant: 'destructive',
        className: 'bg-[#1a1a1a] text-white',
      });
    } finally {
      setProcessing(prev => ({ ...prev, [withdrawal.id]: null }));
    }
  };

  const handleReject = async (withdrawal) => {
    if (!window.confirm(`Reject withdrawal request for ${withdrawal.username || withdrawal.userId}?`)) {
      return;
    }
    
    setProcessing(prev => ({ ...prev, [withdrawal.id]: 'rejecting' }));
    
    try {
      await onReject(withdrawal.id);
      toast({
        title: 'Withdrawal Rejected',
        description: `Withdrawal request rejected for ${withdrawal.username || withdrawal.userId}`,
        variant: 'destructive',
        className: 'bg-[#1a1a1a] text-white',
      });
    } catch (error) {
      console.error(`Error rejecting withdrawal:`, error);
      toast({
        title: 'Error',
        description: 'Failed to reject withdrawal',
        variant: 'destructive',
        className: 'bg-[#1a1a1a] text-white',
      });
    } finally {
      setProcessing(prev => ({ ...prev, [withdrawal.id]: null }));
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#FFD429]">Pending Withdrawals</h2>
        <p className="text-sm text-muted-foreground">Review withdrawal requests submitted by users</p>
      </div>

      {pendingWithdrawals.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No pending withdrawals.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {pendingWithdrawals.map((withdrawal) => {
            const isProcessing = processing[withdrawal.id];
            const isApproving = isProcessing === 'approving';
            const isRejecting = isProcessing === 'rejecting';

            return (
              <Card 
                key={withdrawal.id}
                className="bg-white/10 border-none shadow-md overflow-hidden"
              >
                <CardContent className="p-4 bg-[#483D8B] space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#FFD429] truncate pr-2">
                        <Wallet className="inline h-4 w-4 mr-1" />
                        Withdrawal Request
                      </h3>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-blue-400" />
                        <span className="text-[#BCCCDC]">User: </span>
                        <span className="text-sky-300 font-semibold">
                          {withdrawal.username ? `@${withdrawal.username}` : `User ${withdrawal.userId}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#BCCCDC]">Amount: </span>
                        <span className="text-green-400 font-semibold">{withdrawal.amount?.toLocaleString()} STON</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#BCCCDC]">TON: </span>
                        <span className="text-blue-400 font-semibold">{stonToTon(withdrawal.amount)} TON</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-[#BCCCDC]">Date: </span>
                        <span className="text-white text-xs">{formatDate(withdrawal.createdAt)}</span>
                      </div>
                      
                      {withdrawal.userBalance !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#BCCCDC]">Balance: </span>
                          <span className="text-yellow-400">{withdrawal.userBalance?.toLocaleString()} STON</span>
                          {withdrawal.amount > (withdrawal.userBalance || 0) && (
                            <span className="text-red-400 text-xs">⚠️ Exceeds balance!</span>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#BCCCDC]">Wallet: </span>
                        </div>
                        <div className="bg-black/20 p-2 rounded flex items-center justify-between">
                          <span className="font-mono text-white text-xs break-all pr-2">
                            {withdrawal.walletAddress}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(withdrawal.walletAddress)}
                              className="h-6 w-6 p-0 hover:bg-gray-700"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openTonScan(withdrawal.walletAddress)}
                              className="h-6 w-6 p-0 hover:bg-gray-700"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-white/10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 bg-green-900/20 hover:bg-green-900/30 text-green-400 border-green-900/30"
                      onClick={() => handleApprove(withdrawal)}
                      disabled={isProcessing}
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Approving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" /> Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 h-8 bg-red-900/20 hover:bg-red-900/30 text-red-400"
                      onClick={() => handleReject(withdrawal)}
                      disabled={isProcessing}
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Rejecting...
                        </>
                      ) : (
                        <>
                          <X className="mr-1 h-3.5 w-3.5" /> Reject
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingWithdrawTab;
