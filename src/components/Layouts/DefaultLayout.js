import Header from "@/components/Header"
import Footer from "@/components/Footer"
const DefaultLayout = ({ children }) => {
  return (
    <main className="bg-gray-600 text-lime-100 min-h-screen min-w-screen">
      <div className="container">
        <Header />
        <div className="min-h-[calc(100vh-185px)]">
          {children}
        </div>
        <Footer />
      </div>
    </main>
  )
}

export default DefaultLayout