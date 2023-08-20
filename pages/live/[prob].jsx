import NicePage from '../../components/nicepage';
import { useState, useRef, useEffect } from 'react';
import { getPostData } from '../../customStuff/problems';
import { red } from 'console-log-colors';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useToast } from '@chakra-ui/react';
import Link from 'next/link';

export default function LiveProblem({ probData }) {
  const API_IP = `34.136.231.150`;
  const API_URL = `http://${API_IP}:2358`;
  const [submission, setSubmission] = useState();

  function encode(jsonObj) {
    if (typeof jsonObj !== 'object' || jsonObj === null) {
      if (typeof jsonObj == 'string') return Buffer.from(jsonObj).toString('base64');
      return jsonObj;
    }
    if (Array.isArray(jsonObj)) {
      return jsonObj.map((item) => encode(item));
    }
    const result = {};
    for (const key in jsonObj) {
      if (jsonObj.hasOwnProperty(key)) {
        const value = jsonObj[key];
        if (typeof value === 'string') {
          // Encoding the string value to Base64
          result[key] = Buffer.from(value).toString('base64');
        } else if (typeof value === 'object' && value !== null) {
          // Recursively encoding inner objects or arrays
          result[key] = encode(value);
        } else {
          // For other types, retain the value as is
          result[key] = value;
        }
      }
    }

    return result;
  }

  function decode(jsonObj) {
    if (typeof jsonObj !== 'object' || jsonObj === null) {
      if (typeof jsonObj == 'string') return Buffer.from(jsonObj, 'base64').toString('utf-8');
      return jsonObj;
    }
    if (Array.isArray(jsonObj)) {
      return jsonObj.map((item) => decode(item));
    }
    const result = {};
    for (const key in jsonObj) {
      if (jsonObj.hasOwnProperty(key)) {
        const value = jsonObj[key];
        if (typeof value === 'string' && key != 'token' && !/^\d+\.\d+$/.test(value)) {
          // Decoding the Base64 string back to its original form
          try {
            result[key] = Buffer.from(value, 'base64').toString('utf-8');
          } catch (error) {
            // In case of decoding error, keep the value as it is
            result[key] = value;
          }
        } else {
          // For other types, retain the value as is
          result[key] = value;
        }
      }
    }

    return result;
  }

  useEffect(() => {
    if (submission?.status == 'Pending') {
      //Generate JSON request for one submission
      const generateRequest = (src, langID, stdinput, stdoutput, tl, ml) => {
        return encode({
          source_code: src,
          language_id: langID,
          stdin: stdinput.toString(),
          number_of_runs: null,
          expected_output: stdoutput.toString(),
          cpu_time_limit: tl,
          cpu_extra_time: 0,
          wall_time_limit: 10,
          memory_limit: null,
          stack_limit: null,
          max_processes_and_or_threads: 2,
          enable_per_process_and_thread_time_limit: null,
          enable_per_process_and_thread_memory_limit: null,
          max_file_size: null,
          enable_network: null,
        });
      };

      let langID = 0;
      switch (submission.language) {
        case 'C++':
          langID = 52;
          break;

        default:
          break;
      }

      //Create array of all stdins and expected stdouts
      let reqArray = [];
      for (let i = 0; i < probData.tcIn.length; i++) {
        reqArray.push(
          generateRequest(submission.src, langID, probData.tcIn[i], probData.tcOut[i], probData.time, probData.mem)
        );
      }

      //Send all submissions (one submission per test case) and fetch tokens for each
      fetch(`${API_URL}/submissions/batch/?base64_encoded=true`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authn: 'frfrnocap',
        },
        body: JSON.stringify({
          submissions: reqArray,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          //combine tokens and start recursively querying status till valid result
          if (res.error) {
            console.log('Error in submission POST: ' + red(res.error));
            return;
          }
          let tokenString = '';
          for (let tok of res) tokenString += tok.token + ',';
          recursiveQuery(tokenString, []);
        })
        .catch((e) => {
          console.log(red('FATAL ERROR: ' + e));
        });
    }
  }, [submission]);

  const onSubmittion = (src, lang) => {
    setSubmission({
      name: 'Submission 1',
      src: src,
      status: 'Pending',
      language: 'C++',
      rp: -1,
      tcs: [],
    });
  };

  //keep requesting status of all submissions for one code until valid result
  const recursiveQuery = (token, unstatefulTcs, index = 0) => {
    setTimeout(() => {
      fetch(`${API_URL}/submissions/batch?tokens=${token}&base64_encoded=true`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Authn: 'frfrnocap',
        },
      })
        .then((res) => res.json())
        .then((res) => {
          let newTokenString = '';

          for (let result of res.submissions) {
            if (result.status && (result.status.id == 2 || result.status.id == 1)) {
              if (index < 50) {
                newTokenString += result.token + ',';
              } else {
                console.log(red('SERVER ERROR. Over 50 requests were responded with processing'));
              }
            } else {
              console.log(decode(result));
              unstatefulTcs.push(decode(result));
            }
          }

          //Update stateful submission based on unstatefulTC (which collects all received test case results one by one)
          const updatedSubmission = { ...submission, status: 'Done', tcs: unstatefulTcs };
          setSubmission(updatedSubmission);

          if (newTokenString != '') recursiveQuery(newTokenString, unstatefulTcs, index + 1);
        })
        .catch((e) => {
          console.log(red('FATAL ERROR: ' + e));
        });
    }, 4000);
  };

  const [file, setFile] = useState();
  const inputRef = useRef();
  const formRef = useRef();

  const handleUploadClick = () => {
    // 👇 We redirect the click event onto the hidden input element
    inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (!e.target.files) {
      return;
    }
    setFile(e.target.files[0]);
  };

  const toast = useToast();

  function onSubmit() {
    if (submission && submission.tcs.length != probData.tcIn.length) {
      toast({
        title: 'Unable to submit code.',
        description:
          'Another submission currently has pending results. Please wait for it to complete before creating another submission. ',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
      return;
    }

    var fr = new FileReader();
    fr.onload = function () {
      const FileNameExtensions = file.name.split('.');
      const LastFileNameExtension = FileNameExtensions[FileNameExtensions.length - 1];
      setFile(null);
      formRef.current?.reset();
      onSubmittion(fr.result, LastFileNameExtension);
    };
    fr.readAsText(file);
  }

  function stringLimit(input) {
    if (input.length > 20) {
      return input.slice(0, 20) + '...';
    }
    return input;
  }

  return (
    <NicePage selected='compete' title='Live Contest'>
      <div className=' h-full mt-36  px-24'>
        <div className='grid grid-cols-3 grid-fl grid-rows-1 gap-24  '>
          <div className='col-span-2 '>
            <Link href='/live' className='w-full mt-4 text-lg robo hover:underline cursor-pointer '>
              <ArrowBackIcon /> Back to all questions
            </Link>
            <div className='border-b pb-3'>
              <h1 className='-ml-1 text-6xl mt-12 text-primc mont'>{probData.title}</h1>
              <h1 className='text-lg robo mt-3'>Time Limit: {probData.time}s</h1>
              <h1 className='text-lg robo'>Memory Limit: {probData.mem} mb</h1>
            </div>
            <div
              id='ProblemMdWrapper'
              className=' rounded-md text-neutral-200 mt-32 mb-32'
              dangerouslySetInnerHTML={{ __html: probData.contentHtml }}
            ></div>
          </div>
        </div>
        <div className=' h-4/5 fixed right-0 w-1/3 top-36 pr-12  '>
          <div className='gap-2 h-full w-full flex flex-col justify-start items-stretch '>
            {/* 
            <div className='bg-backL grid grid-cols-6 grid-rows-1  gap-4 rounded-md'>
              <div className='text-center robo text-4xl  bg-neutral-600 flex justify-center items-center rounded-l-md'>
                1
              </div>
              <div className=' col-span-5 py-4 pr-4'>
                <p className='robo'>Choose your preffered programming language</p>
                <div className='grid grid-cols-3 items-center w-full mt-3 gap-3'>
                  <button className='robo rounded-md px-4 py-1 bg-primc '>C++</button>
                  <button className='robo rounded-md px-4 py-1 bg-neutral-600'>Java</button>
                  <button className='robo rounded-md px-4 py-1 bg-neutral-600'>Python</button>
                </div>
              </div>
            </div>
            <div className='bg-backL grid grid-cols-6 grid-rows-1  gap-4 rounded-md'>
              <div className='text-center robo text-4xl  bg-neutral-600 flex justify-center items-center rounded-l-md'>
                2
              </div>
              <div className=' col-span-5 py-4 pr-4'>
                <p className='robo'>Upload your source code file</p>
                <input type='file' ref={inputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <button
                  className={`${
                    file ? 'italic' : ''
                  } rounded-md bg-neutral-600 hover:bg-neutral-500 transition-all robo py-1 mt-2  w-full`}
                  onClick={handleUploadClick}
                >
                  {file ? `${stringLimit(file.name)}` : 'Upload File'}
                </button>
              </div>
            </div>
            <div className='bg-backL grid grid-cols-6 grid-rows-1  gap-4 rounded-md'>
              <div className='text-center robo text-4xl  bg-neutral-600 flex justify-center items-center rounded-l-md'>
                3
              </div>
              <div className=' col-span-5 py-4 pr-4'>
                <p className='robo'>Submit code. </p>
                <button className=' rounded-md robo bg-green-700 w-full mt-4 py-1'> Submit</button>
              </div>
            </div>
            <div className='bg-backL rounded-md h-full grid grid-cols-6 grid-rows-1  gap-4 '>
              <div className='text-center robo text-4xl  bg-neutral-600 flex justify-center items-center rounded-l-md'>
                4
              </div>
              <div className='col-span-5  py-4 pr-4 '>
                <h2 className='robo'>View Recent Submissions</h2>
                <h3 className='robo text-base text-neutral-400 mt-1'>
                  There is no limit to number of submissions, however only the latest submission will count towards rank
                  progress
                </h3>
              </div>
            </div> */}
            <div className='bg-backL rounded-md p-8 py-6'>
              <h1 className='robo text-2xl'>Submit code</h1>
              <h2 className='robo text-base text-neutral-400'>
                You may create as many submissions as you want, however only the last submission will count towards rank
                progress
              </h2>
              <div className='grid grid-cols-2 mt-6 gap-4'>
                <form ref={formRef} style={{ display: 'none' }}>
                  <input type='file' ref={inputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                </form>
                <button
                  className={`${
                    file ? 'italic' : ''
                  } rounded-md bg-neutral-600 hover:bg-neutral-500 transition-all robo py-1 px-4  w-full`}
                  onClick={handleUploadClick}
                >
                  {file ? `${stringLimit(file.name)}` : 'Upload File'}
                </button>
                <button
                  className='robo w-full rounded-md px-4 py-1 bg-green-700 hover:bg-green-600 transition-all'
                  onClick={onSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
            <div className='bg-backL rounded-md px-8 py-6 h-full flex flex-col justify-start items-stretch overflow-y-auto customScroll'>
              <h1 className='robo text-2xl'>Results</h1>
              <h2 className='robo text-base text-neutral-400'>
                Below are the results of your code being tested against {probData.tcIn.length} hidden test cases
              </h2>
              {submission === undefined ? (
                <div className={`h-full mt-8 robo  flex flex-col gap-3 justify-center`}>
                  <div className='text-center italic text-neutral-400 robo pb-24'>No recent submissions</div>
                </div>
              ) : (
                <div className={`h-full mt-8 robo  flex flex-col gap-3 justify-start `}>
                  {submission.tcs.map((e, index) => (
                    <a
                      key={index}
                      href={`/testCase/${e.token}`}
                      target='_blank'
                      className={`rounded-md px-4 py-2 flex cursor-pointer justify-start ${
                        e.status.description == 'Accepted'
                          ? 'bg-green-700  hover:bg-green-600'
                          : 'bg-pink-600 hover:bg-pink-500'
                      }`}
                    >
                      <p>
                        {index + 1}
                        {'.   '}
                        {e.status.description}
                      </p>
                      <p className='italic text-neutral-400 flex-1 text-right'>Click to view details</p>
                    </a>
                  ))}
                  {Array.from('x'.repeat(probData.tcIn.length - submission.tcs.length)).map((e, index) => (
                    <div key={index} className={`bg-neutral-600 rounded-md px-4 py-2`}>
                      Pending
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 
        <div className='flex flex-col justify-center gap-4 items-center mt-32 h-96 m-8'>
          <Textarea
            value={inp2Val}
            className='w-full h-full mono p-4 rounded-md'
            onInput={(e) => {
              setInp2Val(e.target.value);
            }}
            defaultValue={`#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n  std::cout << "Hello World!";\n  return 0;\n}`}
          ></Textarea>
          <Button
            className='bg-neutral-600 px-4 py-2 robo rounded-md'
            onClick={() => {
              onSubmittion();
            }}
          >
            {' '}
            SUBMIT
          </Button>
        </div> */}
      </div>
    </NicePage>
  );
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const probData = await getPostData(params.prob, true);
  return {
    props: {
      probData,
    },
  };
}
