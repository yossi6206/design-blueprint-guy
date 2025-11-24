import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";

const Index = () => {
  return (
    <>
      <div className="flex min-h-screen bg-background justify-center pb-[140px] md:pb-0">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <Feed />
        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
      <MobileNav />
    </>
  );
};

export default Index;
