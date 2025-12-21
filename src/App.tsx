import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import Launch from "./pages/Launch";
import Profile from "./pages/Profile";
import Earnings from "./pages/Earnings";
import SocialAccounts from "./pages/SocialAccounts";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSubmissions from "./pages/AdminSubmissions";
import AdminCampaignSubmissions from "./pages/AdminCampaignSubmissions";
import AdminUserSubmissions from "./pages/AdminUserSubmissions";
import AdminPayouts from "./pages/AdminPayouts";
import AdminCampaignPayouts from "./pages/AdminCampaignPayouts";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminBrands from "./pages/AdminBrands";
import AdminSocialAccounts from "./pages/AdminSocialAccounts";
import BrandApplication from "./pages/BrandApplication";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/brand-application" element={
              <ProtectedRoute>
                <BrandApplication />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <Campaigns />
              </ProtectedRoute>
            } />
            <Route path="/campaigns/:id" element={
              <ProtectedRoute>
                <CampaignDetail />
              </ProtectedRoute>
            } />
            <Route path="/launch" element={
              <ProtectedRoute allowedRoles={["admin", "brand"]}>
                <Launch />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/earnings" element={
              <ProtectedRoute>
                <Earnings />
              </ProtectedRoute>
            } />
            <Route path="/social-accounts" element={
              <ProtectedRoute>
                <SocialAccounts />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/submissions" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/admin/submissions/:campaignId" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCampaignSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/admin/submissions/:campaignId/user/:userId" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUserSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/admin/payouts" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCampaignPayouts />
              </ProtectedRoute>
            } />
            <Route path="/admin/payouts/campaign/:campaignId" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCampaignPayouts />
              </ProtectedRoute>
            } />
            <Route path="/admin/payouts/campaign/:campaignId/user/:userId" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUserDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/brands" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminBrands />
              </ProtectedRoute>
            } />
            <Route path="/admin/social-accounts" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSocialAccounts />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
