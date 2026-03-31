import Sidebar from "./components/Sidebar";
import Map from "./features/map/Map";
import MobileBottomBar from "./components/MobileBottomBar";

export default function Home() {
  return (
    <>
      <div className="flex h-screen w-screen">
        <Sidebar />
        <Map />
      </div>
      <MobileBottomBar />
    </>
  );
}
