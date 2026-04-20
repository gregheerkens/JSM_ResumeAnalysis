import { Link } from "react-router";

export default function Navbar() {
  return (
    <nav className="navbar">
        <Link to="/">
            <p className="text-2xl font-bold text-gradient">
                Resumind
            </p>
        </Link>
        <div className="flex gap-3">
            <Link to="/archetypes" className="primary-button w-fit">
                Archetypes
            </Link>
            <Link to="/upload" className="primary-button w-fit">
                Analyze Resume
            </Link>
        </div>
    </nav>
  )
}