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
import AdminUsers from "./pages/AdminUsers";
import AdminBalances from "./pages/AdminBalances";
import AdminAssignCampaign from "./pages/AdminAssignCampaign";
import ClientDashboard from "./pages/ClientDashboard";
import ClientSubmissions from "./pages/ClientSubmissions";
import ClientCampaignSubmissions from "./pages/ClientCampaignSubmissions";
import ClientUserSubmissions from "./pages/ClientUserSubmissions";
import BrandApplication from "./pages/BrandApplication";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import AdminFinalReviews from "./pages/AdminFinalReviews";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

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
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
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
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/balances" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminBalances />
              </ProtectedRoute>
            } />
            <Route path="/admin/assign-campaigns" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAssignCampaign />
              </ProtectedRoute>
            } />
            <Route path="/admin/final-reviews" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminFinalReviews />
              </ProtectedRoute>
            } />
            <Route path="/client" element={
              <ProtectedRoute allowedRoles={["client_admin", "client_manager", "client_viewer"]}>
                <ClientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/client/submissions" element={
              <ProtectedRoute allowedRoles={["client_admin", "client_manager", "client_viewer"]}>
                <ClientSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/client/submissions/:campaignId" element={
              <ProtectedRoute allowedRoles={["client_admin", "client_manager", "client_viewer"]}>
                <ClientCampaignSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/client/submissions/:campaignId/user/:userId" element={
              <ProtectedRoute allowedRoles={["client_admin", "client_manager", "client_viewer"]}>
                <ClientUserSubmissions />
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
