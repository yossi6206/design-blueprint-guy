import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <Feed />
      <RightSidebar />
    </div>
  );
};

export default Index;
