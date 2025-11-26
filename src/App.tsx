import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Post from "./pages/Post";
import Test from "./Test";

// Lazy load all secondary routes for faster initial load
const Profile = lazy(() => import("./pages/Profile"));
const Search = lazy(() => import("./pages/Search"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Messages = lazy(() => import("./pages/Messages"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ExperimentDashboard = lazy(() => import("./pages/ExperimentDashboard"));
const Hashtag = lazy(() => import("./pages/Hashtag"));
const Followers = lazy(() => import("./pages/Followers"));
const Suggestions = lazy(() => import("./pages/Suggestions"));
const VerificationRequest = lazy(() => import("./pages/VerificationRequest"));
const Notifications = lazy(() => import("./pages/Notifications"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageTransition>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background" />}>
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
        </PageTransition>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
