import { useEffect, useState } from 'react';
import NicePage from '../../components/nicepage';
import { useUser } from '../../customStuff/useDB';
import useRank from '../../customStuff/useRank';
import DropdownMenu from '../../components/Menu';
import Link from 'next/link';
import { getAllGuides } from '../../customStuff/guides';
import { rankDescription, ranks, unpretty } from '../../customStuff/nameMapping';

export default function LearnIndex({ chaps }) {
  let { userData, signedState } = useUser();
  const [rank, setRank] = useState('loading');

  useEffect(() => {
    useRank(userData, signedState, (newRank) => {
      setRank(newRank);
    });
  }, [userData, signedState]);

  return (
    <NicePage selected='learn'>
      <div className=' min-h-screen relative'>
        <div className='  flex  justify-between items-center pt-44 pb-12 px-24 mb-12 mx-auto w-3/4 border-b'>
          <div className='w-1/2  '>
            <h1 className='mont text-6xl text-primc mb-2'>{rank}</h1>
            <p className='mont text-neutral-300'>{rankDescription[unpretty(rank)]}</p>
          </div>
          <div className='w-auto flex justify-center items-center flex-col bg-neutral-700 p-6 border border-neutral-500 rounded-md'>
            <h2 className='text-center robo mb-4'>Done with the guides? Now practice on our extensive problemsets</h2>
            <Link
              href={`/practice/${unpretty(rank)}/anytopic`}
              className='robo  px-4 py-2 w-full bg-primc hover:bg-cyan-800 transition-all rounded-md flex justify-start gap-2 items-center'
            >
              <svg
                stroke='currentColor'
                fill='currentColor'
                stroke-width='0'
                viewBox='0 0 24 24'
                height='1.3em'
                width='1.3em'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M7.375 16.781l1.25-1.562L4.601 12l4.024-3.219-1.25-1.562-5 4C2.138 11.409 2 11.696 2 12s.138.591.375.781L7.375 16.781zM16.625 7.219l-1.25 1.562L19.399 12l-4.024 3.219 1.25 1.562 5-4C21.862 12.591 22 12.304 22 12s-.138-.591-.375-.781L16.625 7.219z'></path>
                <path transform='rotate(102.527 12 12)' d='M2.78 11H21.219V13.001H2.78z'></path>
              </svg>
              Go to Practice
            </Link>
          </div>
        </div>
        <div className='flex justify-center items-start w-full'>
          <div className='grid grid-cols-1 gap-4 w-3/4 mt-12 '>
            {rank != 'loading'
              ? chaps[unpretty(rank)].map((element, index) => (
                  <Link
                    href={`/learn/${unpretty(rank)}/${element.id}`}
                    key={index}
                    className='relative rounded-md bg-neutral-700 border border-neutral-500 hover:bg-neutral-600 transition-all cursor-pointer px-6 py-4 flex justify-start items-center'
                  >
                    <div className=' rounded-full mr-8 robo text-4xl text-primc pb-1'>{element.id}</div>
                    <div className=''>
                      <div>
                        <h2 className='robo text-2xl'>{element.title}</h2>
                        <p className='robo text-neutral-400'>{element.description}</p>
                      </div>
                      {/* <div className='absolute right-12 bg-backL rounded-full h-12 w-12'></div> */}
                    </div>
                  </Link>
                ))
              : ''}
          </div>
        </div>
        <div className=' bottom-8 absolute  w-full robo rounded-md flex justify-center items-center gap-2'>
          <div className='bg-neutral-700 px-4 py-2 rounded-md flex justify-center items-center gap-3 mid-shadow'>
            <span>Viewing Chapters of</span>
            <DropdownMenu defaultValue={rank} opts={ranks} whenChange={(e) => setRank(e)}></DropdownMenu>
          </div>
        </div>
      </div>
    </NicePage>
  );
}

/* -------------------------------------------------------------------------- */
/*                                     SSG                                    */
/* -------------------------------------------------------------------------- */

export async function getStaticProps({ params }) {
  const chaps = await getAllGuides();
  return { props: { chaps: chaps } };
}
