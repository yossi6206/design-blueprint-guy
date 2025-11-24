import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { FloatingPostButton } from "@/components/FloatingPostButton";

const Index = () => {
  return (
    <>
      <div className="flex min-h-screen bg-background justify-center pb-[140px] md:pb-0 relative overflow-hidden">
        {/* Subtle Background Gradients - matching Auth page */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-primary opacity-5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -right-4 w-96 h-96 bg-gradient-secondary opacity-5 rounded-full blur-3xl" />
        </div>
        
        <div className="hidden md:block relative z-10">
          <Sidebar />
        </div>
        <div className="relative z-10 w-full flex justify-center">
          <Feed />
        </div>
        <div className="hidden lg:block relative z-10">
          <RightSidebar />
        </div>
      </div>
      <FloatingPostButton />
      <MobileNav />
    </>
  );
};

export default Index;
