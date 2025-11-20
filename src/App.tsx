import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Bookmarks from "./pages/Bookmarks";
import Hashtag from "./pages/Hashtag";
import Followers from "./pages/Followers";
import Suggestions from "./pages/Suggestions";
import ExperimentDashboard from "./pages/ExperimentDashboard";
import AdminPanel from "./pages/AdminPanel";
import Test from "./Test";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/test" element={<Test />} />
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile/:handle" element={<Profile />} />
          <Route path="/profile/:handle/followers" element={<Followers />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/experiments" element={<ExperimentDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/hashtag/:tag" element={<Hashtag />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
