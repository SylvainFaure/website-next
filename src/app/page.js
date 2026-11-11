import DefaultLayout from '@/components/Layouts/DefaultLayout'
import HomeLinks from '@/components/HomeLinks'

export default function Home() {
  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-185px)]">
        <h1 className="text-3xl font-semibold">Hi I&apos;m Sylvain, I&apos;m a web developer</h1>
        <div className="mt-4">
          <HomeLinks />
        </div>
      </div>
    </DefaultLayout>
  )
}
