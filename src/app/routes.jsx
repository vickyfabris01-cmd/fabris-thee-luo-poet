import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Poems from "../pages/Poems";
import Videos from "../pages/Videos";
import Video from "../pages/Video";
import Live from "../pages/Live";
import Invite from "../pages/Invite";
import SecretLogin from "../pages/SecretLogin";
import Dashboard from "../pages/Dashboard";
import PoemPage from "../pages/Poem";
import Brand from "../pages/Brand";
import DashboardOverview from "../pages/dashboard/Overview";
import DashboardPoems from "../pages/dashboard/Poems";
import DashboardVideos from "../pages/dashboard/Videos";
import DashboardLive from "../pages/dashboard/Live";
import DashboardComments from "../pages/dashboard/Comments";
import DashboardInvites from "../pages/dashboard/Invites";
import DashboardNotifications from "../pages/dashboard/Notifications";
import DashboardMediaLibrary from "../pages/dashboard/MediaLibrary";
import DashboardSettings from "../pages/dashboard/Settings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/poems" element={<Poems />} />
      <Route path="/poems/:id" element={<PoemPage />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/videos/:id" element={<Video />} />
      <Route path="/live" element={<Live />} />
      <Route path="/invite" element={<Invite />} />
      <Route path="/brand" element={<Brand />} />
      <Route path="/secret-login" element={<SecretLogin />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<DashboardOverview />} />
        <Route path="poems" element={<DashboardPoems />} />
        <Route path="videos" element={<DashboardVideos />} />
        <Route path="live" element={<DashboardLive />} />
        <Route path="comments" element={<DashboardComments />} />
        <Route path="invites" element={<DashboardInvites />} />
        <Route path="notifications" element={<DashboardNotifications />} />
        <Route path="library" element={<DashboardMediaLibrary />} />
        <Route path="profile" element={<DashboardSettings />} />
      </Route>
    </Routes>
  );
}
