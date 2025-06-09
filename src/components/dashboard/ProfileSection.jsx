import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wallet,
  Link as LinkIcon,
  Gift,
  Zap,
  Users,
  CheckCircle2,
  Copy,
  Unlink,
  X,
  AlertTriangle,
  Send,
  History,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { connectWallet, disconnectWallet, getCurrentUser } from "@/data";
import {
  createWithdrawalRequest,
  getUserWithdrawalHistory,
} from "@/data/firestore/adminActions";

const ProfileSection = ({ user, refreshUserData }) => {
  const [walletInput, setWalletInput] = useState("");
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [copying, setCopying] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  const adminUsername = import.meta.env.VITE_ADMIN_TG_USERNAME;
  const isBanned = user.isBanned;

  const handleConnectWallet = async () => {
    if (!user?.id) return;
    if (walletInput.trim()) {
      if (
        walletInput.length === 48 &&
        (walletInput.startsWith("EQ") || walletInput.startsWith("UQ"))
      ) {
        const success = await connectWallet(user.id, walletInput);
        if (success) {
          const updatedUser = await getCurrentUser(user.id);
          if (updatedUser) refreshUserData(updatedUser);
          setWalletInput("");
          setShowWalletDialog(false);
          toast({
            title: "Wallet Connected",
            description: `Wallet ${walletInput.substring(
              0,
              6
            )}...${walletInput.substring(walletInput.length - 4)} added.`,
            variant: "success",
            className: "bg-[#1a1a1a] text-white",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to connect wallet.",
            variant: "destructive",
            className: "bg-[#1a1a1a] text-white",
          });
        }
      } else {
        toast({
          title: "Invalid Wallet",
          description:
            "TON address must be 48 characters starting with EQ or UQ.",
          variant: "destructive",
          className: "bg-[#1a1a1a] text-white",
        });
      }
    } else {
      toast({
        title: "Wallet Required",
        description: "Please enter your TON wallet address.",
        variant: "destructive",
        className: "bg-[#1a1a1a] text-white",
      });
    }
  };

  const handleDisconnectWallet = async () => {
    if (!user?.id) return;
    const success = await disconnectWallet(user.id);
    if (success) {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) refreshUserData(updatedUser);
      toast({
        title: "Wallet Disconnected",
        variant: "default",
        className: "bg-[#1a1a1a] text-white",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to disconnect wallet.",
        variant: "destructive",
        className: "bg-[#1a1a1a] text-white",
      });
    }
  };

  const handleCopyWallet = async () => {
    if (!user.wallet) return;
    try {
      await navigator.clipboard.writeText(user.wallet);
      setCopying(true);
      toast({
        title: "Wallet copied!",
        description: user.wallet,
        className: "bg-[#1a1a1a] text-white break-all whitespace-pre-line",
      });
      setTimeout(() => setCopying(false), 1200);
    } catch {
      toast({
        title: "Copy failed!",
        variant: "destructive",
        className: "bg-[#1a1a1a] text-white",
      });
    }
  };

  const sendAdminNotification = async (message) => {
    try {
      await fetch(
        `https://api.telegram.org/bot${
          import.meta.env.VITE_TG_BOT_TOKEN
        }/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "5063003944", // Admin chat ID
            text: message,
            parse_mode: "HTML",
          }),
        }
      );
    } catch (err) {
      console.error("Failed to send admin notification:", err);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.id || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    const minWithdrawal = 10000000; // 1 TON in STON

    if (amount < minWithdrawal || amount > (user.balance || 0)) {
      toast({
        title: "Invalid Amount",
        description: `Minimum withdrawal is ${minWithdrawal.toLocaleString()} STON (1 TON) and must be within your balance.`,
        variant: "destructive",
        className: "bg-[#1a1a1a] text-white",
      });
      return;
    }

    setVerifying(true);

    const success = await createWithdrawalRequest(
      user.id,
      amount,
      user.wallet,
      user.balance,
      user.username
    );

    if (success) {
      const userMention = user.username
        ? `@${user.username}`
        : `User  ${user.id}`;
      await sendAdminNotification(
        `💰 <b>Withdrawal Request</b>\n${userMention} requested to withdraw <b>${amount} STON</b>\nWallet: ${
          user.wallet
        }\nConversion: ${stonToTon(amount)} TON`
      );

      toast({
        title: "Withdrawal Requested",
        description: `You have requested to withdraw ${amount} STON.`,
        variant: "success",
        className: "bg-[#1a1a1a] text-white",
      });
      setWithdrawAmount("");
      setShowWithdrawDialog(false);
    } else {
      toast({
        title: "Withdrawal Failed",
        description:
          "Could not process your withdrawal request. Please try again later.",
        variant: "destructive",
        className: "bg-[#1a1a1a] text-white",
      });
    }
    setVerifying(false);
  };

  const handleShowHistory = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User  ID not found",
        variant: "destructive",
        className: "bg-[#1a1a1a] text-white",
      });
      return;
    }

    setLoadingHistory(true);
    setShowHistoryDialog(true);

    try {
      const history = await getUserWithdrawalHistory(user.id);
      setWithdrawalHistory(history || []);
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      toast({
        title: "Error",
        description: "Failed to load withdrawal history",
        variant: "destructive",
        className: "bg-[#1a1a1a] text-white",
      });
      setWithdrawalHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleMaxClick = () => {
    setWithdrawAmount(user.balance?.toString() || "0");
  };

  const stonToTon = (ston) => {
    const amount = parseFloat(ston) || 0;
    return (amount / 10000000).toFixed(6);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-600 hover:bg-yellow-600/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-600/20 text-green-300 border-green-600 hover:bg-green-600/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-600/20 text-red-300 border-red-600 hover:bg-red-600/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-600/20 text-gray-300 border-gray-600">
            Unknown
          </Badge>
        );
    }
  };

  const tasksDone = user.tasks
    ? Object.values(user.tasks).filter(Boolean).length
    : 0;
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user.username || `User  ${user.id}`;
  const fallbackAvatar = displayName.substring(0, 2).toUpperCase();

  return (
    <div
      className="relative w-full min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] text-white overflow-y-auto"
      style={{
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* Fixed warning at the top */}
      {isBanned && (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center p-2">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-start gap-2 bg-gradient-to-r from-red-700 via-red-600 to-red-500 border-2 border-red-400 rounded-xl p-2 shadow-2xl w-full max-w-md mx-auto"
          >
            <div className="flex-shrink-0 mt-1">
              <AlertTriangle className="text-yellow-300 bg-red-900 rounded-full p-1 w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-white mb-1">
                Account Banned
              </div>
              <div className="text-white/90 text-xs mb-2">
                Your account has been{" "}
                <span className="font-semibold text-yellow-200">banned</span>.
                If you believe this is a mistake, please contact the admin for
                assistance.
              </div>
              <a
                href={`https://t.me/${adminUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-200 font-semibold transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                Contact Admin
              </a>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main scrollable content */}
      <div
        className="flex flex-col items-center px-4 py-4"
        style={{ paddingTop: isBanned ? "140px" : "32px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md flex flex-col items-center gap-4"
        >
          {/* Profile Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Avatar className="h-24 w-24 border-4 border-gradient-to-r from-blue-500 to-purple-600 shadow-2xl">
              <AvatarImage
                src={
                  user.profilePicUrl ||
                  `https://avatar.vercel.sh/${user.username || user.id}.png`
                }
                alt={user.username || user.id}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-700 text-white text-lg font-bold">
                {fallbackAvatar}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </motion.div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {displayName}
            </h1>
            <p className="text-sm text-blue-400 font-medium">
              @{user.username || "telegram_user"}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-2 w-full"
          >
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm p-3 rounded-2xl text-center border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-center mb-1">
                <Wallet className="h-5 w-5 text-blue-400 mr-1" />
                <span className="text-gray-300 font-medium text-xs">
                  Balance
                </span>
              </div>
              <p className="text-lg font-bold text-white">
                {user.balance?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-blue-300">STON</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-sm p-3 rounded-2xl text-center border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-center mb-1">
                <Zap className="h-5 w-5 text-yellow-400 mr-1" />
                <span className="text-gray-300 font-medium text-xs">
                  Energy
                </span>
              </div>
              <p className="text-lg font-bold text-white">{user.energy || 0}</p>
              <p className="text-xs text-yellow-300">Points</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm p-3 rounded-2xl text-center border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-5 w-5 text-purple-400 mr-1" />
                <span className="text-gray-300 font-medium text-xs">
                  Referrals
                </span>
              </div>
              <p className="text-lg font-bold text-white">
                {user.referrals || 0}
              </p>
              <p className="text-xs text-purple-300">Friends</p>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm p-3 rounded-2xl text-center border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle2 className="h-5 w-5 text-green-400 mr-1" />
                <span className="text-gray-300 font-medium text-xs">Tasks</span>
              </div>
              <p className="text-lg font-bold text-white">{tasksDone}</p>
              <p className="text-xs text-green-300">Completed</p>
            </div>
          </motion.div>

          {/* Wallet Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <h3 className="text-sm font-semibold text-center mb-2 text-gray-300">
              TON Wallet
            </h3>
            {user.wallet ? (
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-2">
                <div className="flex items-center justify-between gap-2">
                  <Wallet className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span
                    className="flex-1 font-mono text-white text-center px-1 select-text"
                    title={user.wallet}
                    style={{ userSelect: "text" }}
                  >
                    {user.wallet.substring(0, 12)}...
                    {user.wallet.substring(user.wallet.length - 6)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="flex items-center justify-center p-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-all duration-200 active:scale-95"
                      aria-label="Copy Wallet Address"
                      title={copying ? "Copied!" : "Copy Wallet Address"}
                      onClick={handleCopyWallet}
                    >
                      <Copy
                        className={`h-4 w-4 ${
                          copying ? "text-green-400" : "text-blue-400"
                        } transition-colors`}
                      />
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center p-1 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 transition-all duration-200 active:scale-95"
                      aria-label="Disconnect Wallet"
                      title="Disconnect Wallet"
                      onClick={handleDisconnectWallet}
                    >
                      <Unlink className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => setShowWalletDialog(true)}
              >
                <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
              </Button>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full space-y-2"
          >
            <Button
              className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setShowWithdrawDialog(true)}
            >
              <Gift className="mr-2 h-5 w-5" /> Claim Rewards
            </Button>

            <Button
              variant="outline"
              className="w-full h-10 bg-transparent border-2 border-blue-500/50 text-blue-400 hover:bg-blue-600/20 hover:border-blue-400 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={handleShowHistory}
            >
              <History className="mr-2 h-5 w-5" /> Withdrawal History
            </Button>
          </motion.div>
        </motion.div>

        {/* Help Button*/}
        <div className="fixed top-4 right-4 z-50 rounded-full">
          <Button
            className="bg-green-600 text-white rounded-full p-2"
            onClick={() => {
              window.open(`https://t.me/${adminUsername}`, "_blank");
            }}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Wallet Input Dialog */}
        {showWalletDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600/50 text-white w-full max-w-sm p-4 rounded-2xl shadow-2xl relative"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowWalletDialog(false)}
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold mb-4 text-center">
                Connect TON Wallet
              </h2>
              <Input
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="EQ... or UQ..."
                className="mb-4 h-10 text-white placeholder:text-gray-400 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:border-blue-500 transition-colors"
              />
              <Button
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold"
                onClick={handleConnectWallet}
              >
                <LinkIcon className="w-5 h-5 mr-2" /> Connect Wallet
              </Button>
            </motion.div>
          </div>
        )}

        {/* Withdraw Dialog */}
        {showWithdrawDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600/50 text-white w-full max-w-sm p-4 rounded-2xl shadow-2xl relative max-h-[80vh] overflow-y-auto"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                onClick={() => setShowWithdrawDialog(false)}
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold mb-4 text-center">
                Withdraw STON
              </h2>

              {/* Manual Verification Notice */}
              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-xl p-2 mb-4">
                <p className="text-yellow-300 text-xs text-center">
                  ⚠️ All withdrawals require manual verification by admin before
                  processing.
                </p>
              </div>

              {user.wallet ? (
                <>
                  {/* Wallet Address Display */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1 font-medium">
                      Withdrawal Address:
                    </p>
                    <div className="bg-gray-800/50 border border-gray-600/50 p-2 rounded-xl">
                      <p className="text-xs font-mono text-white break-all">
                        {user.wallet}
                      </p>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1 font-medium">
                      Amount to Withdraw:
                    </p>
                    <div className="relative">
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter STON amount"
                        className="h-10 text-white placeholder:text-gray-400 bg-gray-800/50 border border-gray-600/50 rounded-xl pr-20 focus:border-blue-500"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute right-2 top-2 h-8 px-3 text-xs bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/30"
                        onClick={handleMaxClick}
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-xl p-2">
                      <p className="text-sm text-gray-300 text-center">
                        Available Balance
                      </p>
                      <p className="text-lg font-bold text-white text-center">
                        {user.balance?.toLocaleString() || "0"} STON
                      </p>
                    </div>
                  </div>

                  {/* STON to TON Conversion */}
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-xl p-2">
                      <p className="text-blue-300 text-sm mb-1 text-center font-medium">
                        Auto Conversion:
                      </p>
                      <p className="text-white font-bold text-lg text-center">
                        {withdrawAmount || "0"} STON ={" "}
                        {stonToTon(withdrawAmount)} TON
                      </p>
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        Rate: 10,000,000 STON = 1 TON
                      </p>
                      <p className="text-xs text-yellow-400 mt-1 text-center">
                        Minimum: 10,000,000 STON (1 TON)
                      </p>
                    </div>
                  </div>

                  {/* Withdraw Button */}
                  <Button
                    className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleWithdraw}
                    disabled={
                      verifying ||
                      !withdrawAmount ||
                      parseFloat(withdrawAmount) < 10000000 ||
                      parseFloat(withdrawAmount) > (user.balance || 0)
                    }
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Request Withdrawal"
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-red-500 mb-4">
                    Please set your wallet address first via the wallet
                    connection feature.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl"
                    onClick={() => {
                      setShowWithdrawDialog(false);
                      setShowWalletDialog(true);
                    }}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Withdrawal History Dialog */}
        {showHistoryDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600/50 text-white w-full max-w-lg p-4 rounded-2xl shadow-2xl relative max-h-[80vh] overflow-y-auto"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                onClick={() => setShowHistoryDialog(false)}
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-lg font-bold mb-4 flex items-center">
                <History className="mr-2 h-6 w-6" />
                Withdrawal History
              </h2>

              <div className="overflow-y-auto max-h-[60vh] pr-2">
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-gray-400">
                      Loading history...
                    </span>
                  </div>
                ) : withdrawalHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No withdrawal history found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Your withdrawal requests will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawalHistory.map((withdrawal) => (
                      <Card
                        key={withdrawal.id}
                        className="bg-[#1c1c1c] border-gray-700"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-sky-400" />
                              <span className="font-semibold text-white">
                                {withdrawal.amount?.toLocaleString()} STON
                              </span>
                            </div>
                            {getStatusBadge(withdrawal.status)}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">TON Amount:</span>
                              <span className="text-blue-400 font-mono">
                                {stonToTon(withdrawal.amount)} TON
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-400">Date:</span>
                              <span className="text-white flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(withdrawal.createdAt)}
                              </span>
                            </div>

                            {withdrawal.walletAddress && (
                              <div className="mt-2">
                                <span className="text-gray-400 text-xs">
                                  Wallet:
                                </span>
                                <p className="text-white font-mono text-xs break-all bg-white/5 p-2 rounded mt-1">
                                  {withdrawal.walletAddress}
                                </p>
                              </div>
                            )}

                            {withdrawal.status === "approved" &&
                              withdrawal.approvedAt && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">
                                    Approved:
                                  </span>
                                  <span className="text-green-400">
                                    {formatDate(withdrawal.approvedAt)}
                                  </span>
                                </div>
                              )}

                            {withdrawal.status === "rejected" &&
                              withdrawal.rejectedAt && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">
                                    Rejected:
                                  </span>
                                  <span className="text-red-400">
                                    {formatDate(withdrawal.rejectedAt)}
                                  </span>
                                </div>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
