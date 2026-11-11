
import '@/app/globals.css'

export const metadata = {
  title: 'Sylvain Faure',
  description: ''
}

export default async function RootLayout({ children }) {

  return (
    <html lang={"en"}>
      <body
        className={`transition after:transition after:duration-700 max-w-screen overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
}
