import React, { useEffect, useState } from 'react';

import MemeCard from './MemeCard';
const Body = () => {
  const [memes, setMemes] = useState([]);

  useEffect(() => {
    // setTimeout(() => {
    fetchMemes();
    // }, 5000);
  }, []);

  const fetchMemes = async () => {
    const data = await fetch('https://api.imgflip.com/get_memes');
    const json = await data.json();

    // console.log('json:', json);

    setMemes((memes => [...memes, ...json.data.memes]));
  }

  return (
    <div className='flex flex-wrap m-5 p-5 justify-between items-center'>
      {memes?.map((meme, index) => {
        return (
          <MemeCard key={index} data={meme} />
        );
      })}
    </div>
  )
}

export default Body;