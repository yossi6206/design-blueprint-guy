import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="flex w-full max-w-7xl">
        <Sidebar />
        <Feed />
        <RightSidebar />
      </div>
    </div>
  );
};

export default Index;
