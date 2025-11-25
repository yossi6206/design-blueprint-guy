import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Bookmarks from "./pages/Bookmarks";
import Hashtag from "./pages/Hashtag";
import Followers from "./pages/Followers";
import Suggestions from "./pages/Suggestions";
import VerificationRequest from "./pages/VerificationRequest";
import Notifications from "./pages/Notifications";
import Post from "./pages/Post";
import Test from "./Test";

// Lazy load heavy routes
const Messages = lazy(() => import("./pages/Messages"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ExperimentDashboard = lazy(() => import("./pages/ExperimentDashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <Routes>
            <Route path="/test" element={<Test />} />
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile/:handle" element={<Profile />} />
            <Route path="/profile/:handle/followers" element={<Followers />} />
            <Route path="/post/:postId" element={<Post />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/experiments" element={<ExperimentDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/verification" element={<VerificationRequest />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/hashtag/:tag" element={<Hashtag />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
