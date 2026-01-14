import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";

export default function App() {
  const token = localStorage.getItem("token");

  return token ? <UserProfile /> : <Auth />;
}
