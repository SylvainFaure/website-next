import Link from "next/link"
const Header = () => {
  const menuVoices = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Lists",
      href: "/lists",
    },
    {
      label: "Music",
      href: "/music",
    },
  ]

  return (
    <header className="py-4">
      <nav className="pb-4 border-b border-lime-100">
        <ul className="flex gap-4">
          {menuVoices.map((item) => (
            <li key={item.href} className="font-semibold hover:underline">
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default Header
