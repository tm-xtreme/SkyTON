import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Wallet, User, Calendar, Copy, ExternalLink, History, Download, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

const PendingWithdrawTab = ({ pendingWithdrawals = [], onApprove, onReject, getWithdrawalHistory }) => {
  const [processing, setProcessing] = useState({});
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'approved', 'rejected'
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

  const fetchWithdrawalHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await getWithdrawalHistory();
      setWithdrawalHistory(history || []);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load withdrawal history',
        variant: 'destructive',
        className: 'bg-[#1a1a1a] text-white',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistoryPopup(true);
    fetchWithdrawalHistory();
  };

  const getFilteredHistory = () => {
    if (historyFilter === 'all') return withdrawalHistory;
    return withdrawalHistory.filter(item => item.status === historyFilter);
  };

  const downloadExcel = () => {
    const filteredData = getFilteredHistory();
    
    if (filteredData.length === 0) {
      toast({
        title: 'No Data',
        description: 'No withdrawal history to download',
        variant: 'destructive',
        className: 'bg-[#1a1a1a] text-white',
      });
      return;
    }

    // Prepare data for Excel
    const excelData = filteredData.map((item, index) => ({
      'S.No': index + 1,
      'User ID': item.userId,
      'Username': item.username || 'N/A',
      'Amount (STON)': item.amount,
      'Amount (TON)': stonToTon(item.amount),
      'Wallet Address': item.walletAddress,
      'Status': item.status.charAt(0).toUpperCase() + item.status.slice(1),
      'Request Date': formatDate(item.createdAt),
      'Processed Date': item.status === 'approved' ? formatDate(item.approvedAt) : 
                       item.status === 'rejected' ? formatDate(item.rejectedAt) : 'N/A',
      'User Balance at Request': item.userBalance || 'N/A'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 8 },  // S.No
      { wch: 15 }, // User ID
      { wch: 20 }, // Username
      { wch: 15 }, // Amount STON
      { wch: 15 }, // Amount TON
      { wch: 50 }, // Wallet Address
      { wch: 12 }, // Status
      { wch: 20 }, // Request Date
      { wch: 20 }, // Processed Date
      { wch: 20 }  // User Balance
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Withdrawal History');

    // Generate filename with current date and filter
    const currentDate = new Date().toISOString().split('T')[0];
    const filterText = historyFilter === 'all' ? 'All' : historyFilter.charAt(0).toUpperCase() + historyFilter.slice(1);
    const filename = `Withdrawal_History_${filterText}_${currentDate}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);

    toast({
      title: 'Download Complete',
      description: `${filteredData.length} records downloaded successfully`,
      variant: 'success',
      className: 'bg-[#1a1a1a] text-white',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-300 border border-green-600">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600/20 text-red-300 border border-red-600">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-600/20 text-yellow-300 border border-yellow-600">
            Pending
          </span>
        );
    }
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
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-xl font-bold text-[#FFD429]">Pending Withdrawals</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowHistory}
            className="bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 border-blue-900/30"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
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

      {/* History Popup */}
      {showHistoryPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600/50 text-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600/50">
              <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Withdrawal History</h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                {/* Download Button */}
                <Button
                  onClick={downloadExcel}
                  disabled={getFilteredHistory().length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Excel
                </Button>
                
                {/* Close Button */}
                <Button
                  onClick={() => setShowHistoryPopup(false)}
                  variant="outline"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-gray-400">Loading history...</span>
                </div>
              ) : getFilteredHistory().length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-800/50 border border-gray-600/50 rounded-2xl p-6">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">No withdrawal history found</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {historyFilter !== 'all' ? `No ${historyFilter} withdrawals found` : 'No withdrawals have been processed yet'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredHistory().map((item) => (
                    <Card key={item.id} className="bg-gray-800/50 border-gray-600/50">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* User Info */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-400" />
                              User Information
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">User ID:</span>
                                <span className="text-white">{item.userId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Username:</span>
                                <span className="text-sky-300">
                                  {item.username ? `@${item.username}` : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Status:</span>
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          </div>

                          {/* Amount Info */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-green-400" />
                              Amount Details
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">STON:</span>
                                <span className="text-green-400 font-semibold">
                                  {item.amount?.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">TON:</span>
                                <span className="text-blue-400 font-semibold">
                                  {stonToTon(item.amount)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">User Balance:</span>
                                <span className="text-yellow-400">
                                  {item.userBalance?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Date & Wallet Info */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-400" />
                              Timeline & Wallet
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Requested:</span>
                                <span className="text-white text-xs">
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Processed:</span>
                                <span className="text-white text-xs">
                                  {item.status === 'approved' ? formatDate(item.approvedAt) : 
                                   item.status === 'rejected' ? formatDate(item.rejectedAt) : 'N/A'}
                                </span>
                              </div>
                              <div className="mt-2">
                                <span className="text-gray-400 text-xs">Wallet:</span>
                                <div className="bg-black/20 p-2 rounded mt-1 flex items-center justify-between">
                                  <span className="font-mono text-white text-xs break-all pr-2">
                                    {item.walletAddress}
                                  </span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(item.walletAddress)}
                                      className="h-6 w-6 p-0 hover:bg-gray-700"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => openTonScan(item.walletAddress)}
                                      className="h-6 w-6 p-0 hover:bg-gray-700"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-600/50 p-4 bg-gray-900/50">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  Showing {getFilteredHistory().length} of {withdrawalHistory.length} records
                </span>
                <span>
                  Filter: {historyFilter === 'all' ? 'All Status' : historyFilter.charAt(0).toUpperCase() + historyFilter.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingWithdrawTab;
