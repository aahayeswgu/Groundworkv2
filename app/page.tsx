import Sidebar from "./components/Sidebar";
import MapArea from "./components/MapArea";
import MobileBottomBar from "./components/MobileBottomBar";

export default function Home() {
  return (
    <>
      <div className="flex h-screen w-screen">
        <Sidebar />
        <MapArea />
      </div>
      <MobileBottomBar />
    </>
  );
}
