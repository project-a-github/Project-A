import { Menu } from '@mui/material';
import NicePage from '../../../components/nicepage';
import DropdownMenu from '../../../components/Menu';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import Exercise from '../../../components/Exercise';
import ReactDOM from 'react-dom';
import { useEffect } from 'react';
import MdxRenderer from '../../../components/MdxRenderer';
import { getAllGuides, getGuideData } from '../../../customStuff/guides';
import Link from 'next/link';

import { serialize } from 'next-mdx-remote/serialize';
import { pretty, unpretty } from '../../../customStuff/nameMapping';

export default function Learn({ content, frontMatter, chaps }) {
  const customify = (content) => {
    const substring = '!start ';
    var regex = new RegExp(substring + '[^!]+!', 'gi');
    return content.replace(regex, function (match) {
      let input = match.slice(8, -2);
      input = input.replace(/(?:\r\n|\r|\n)/g, '<br>').split('|NEXT|');
      return `<div data-component="CustomComponent" data-props='{"number": "${input[0]}", "question": "${input[1]}", "answer": "${input[2]}"}'></div>`;
    });
  };

  return (
    <NicePage>
      <div className='md:hidden w-screen h-screen flex justify-center items-center '>
        <div className='w-4/5 rounded-md bg-backL p-8'>
          <h1 className='robo text-center text-2xl mb-8 text-primc'>
            Please Use a larger screen size to view this page
          </h1>
          <p className='robo text-center'>
            We apologize for the inconvinence. <br className='mb-2' /> If you are viewing this, expect a mobile version
            to come out within a few days{' '}
          </p>
        </div>
      </div>

      {/* /* -------------------------------------------------------------------------- */
      /*                                   Content                                  */
      /* -------------------------------------------------------------------------- */}

      <div className=' min-h-screen hidden md:flex justify-end '>
        <div className=' w-3/4  overflow-auto px-32 pt-32 '>
          <div className='border rounded-lg border-neutral-300 p-8 '>
            <h1 className='mont text-6xl font-bold mb-4 text-primc flex justify-start items-center'>
              {' '}
              {frontMatter.title}
            </h1>
            <h2 className='mont '>
              {' '}
              Rank: <strong> {pretty(frontMatter.rank)}</strong>
            </h2>
            <h2 className='mont '>
              Credits:<strong> {frontMatter.credits}</strong>
            </h2>
          </div>

          {/* <div
            className='mt-12'
            id='ProblemMdWrapper'
            dangerouslySetInnerHTML={{ __html: customify(guideData.contentHtml) + `<Exercise data='nice'></Exercise>` }}
          ></div> */}
          {/* <ParsedContentWrapper text={customify(guideData.contentHtml)}></ParsedContentWrapper> */}
          <MdxRenderer mdxSource={content} />
        </div>
      </div>

      {/* /* -------------------------------------------------------------------------- */
      /*                                Chapters.exe                                */
      /* -------------------------------------------------------------------------- */}
      <div className='flex flex-col w-1/4  justify-center items-end pt-10 top-0 left-10 h-screen fixed  '>
        <div className='rounded-md bg-backL  w-11/12 h-4/5 flex flex-col justify-start'>
          <div className='flex justify-between border-b h-18 items-center  bg-neutral-700 rounded-t-md '>
            <p className='m-4 w-96 mono text-lg  '>chapters.exe</p>
            <div className='m-4 w-24    flex  justify-center '>
              <p className='mono text-center w-full text-lg py-0'></p>
            </div>
            <div className='m-4 w-48  justify-end items-center hidden xl:flex'>
              <div className='rounded-full bg-green-500 w-5 h-5 mx-1'></div>
              <div className='rounded-full bg-orange-500 w-5 h-5 mx-1'></div>
              <div className='rounded-full bg-red-500 w-5 h-5 mx-1'></div>
            </div>
          </div>
          <div className=' flex-1 py-6 pl-6  overflow-auto overflow-x-hidden w-full '>
            {/* Chapters Begin */}

            {chaps[unpretty(frontMatter.rank)].map((loopedChapter, index) => (
              <Link href={`/learn/${frontMatter.rank}/${loopedChapter.id}`}>
                <div
                  key={index}
                  className={`${
                    loopedChapter.title == frontMatter.title ? 'bg-primc border-primc !w-11/12' : ''
                  } border px-4 mb-4 py-2 rounded-md w-10/12 relative flex justify-start items-center hover:w-11/12 hover:bg-neutral-700 transition-all`}
                >
                  <span className='robo'>{loopedChapter.title}</span>
                  <span className='flex-1 text-right robo text-2xl pb-1'>{'>'}</span>
                </div>
              </Link>
            ))}

            {/* Chapters End */}
          </div>
        </div>
      </div>
    </NicePage>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 OLD METHOD                                 */
/* -------------------------------------------------------------------------- */

// export async function getStaticProps({ params }) {
//   const urlRank = params.rank;
//   const urlChap = params.chap;
//   const guideData = await getGuideData(urlRank, urlChap);
//   return { props: { guideData: guideData } };
// }

// export async function getStaticPaths() {
//   return {
//     paths: [],
//     fallback: 'blocking',
//   };
// }

/* -------------------------------------------------------------------------- */
/*                                 NEW METHOD                                 */
/* -------------------------------------------------------------------------- */

export async function getStaticProps({ params }) {
  const { id, rank, matterResult } = await getGuideData(params.rank, params.chap);
  const serializedContent = await serialize(matterResult.content);
  const chaps = await getAllGuides();

  const fm = {
    id: id,
    rank: rank,
    ...matterResult.data,
  };

  return {
    props: {
      content: serializedContent,
      frontMatter: fm,
      chaps: chaps,
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}
