import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex mx-auto max-w-[1280px]">
        <Sidebar />
        <Feed />
        <RightSidebar />
      </div>
    </div>
  );
};

export default Index;
