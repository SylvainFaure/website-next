import Icon from "@/components/Icon";
const Player = ({ 
  artists, 
  album, 
  song, 
  url, 
  image, 
  currently_playing = false 
}) => {
  return (
    <div>
      <p className="px-5 sm:px-0 mt-4 sm:-mt-1.5 mb-0 text-xs italic">
        {currently_playing ? 'Currently playing' : 'Last track played'}
      </p>
      
      <div className="flex justify-center gap-3 max-h-[70px] w-auto md:w-full overflow-hidden">
        <div className="relative">
          <img src={image} alt="Album cover" className="w-[70px]" />
          <div className="absolute -bottom-1 right-0.5">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Icon 
                name="spotify"
              />
            </a>
          </div>
        </div>
        
        <div className="p-0">
          <p className="m-0 w-full max-w-[calc(90vw-70px)] whitespace-nowrap overflow-hidden text-ellipsis font-bold">
            {artists}
          </p>
          <p className="m-0 w-full max-w-[calc(90vw-70px)] whitespace-nowrap overflow-hidden text-ellipsis">
            {album}
          </p>
          <p className="m-0 w-full max-w-[calc(90vw-70px)] whitespace-nowrap overflow-hidden text-ellipsis italic">
            {song}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Player;