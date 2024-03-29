import { useState, useRef, useEffect } from 'react';
import { Terminal } from './Terminal.jsx';
import Blob from '../components/blob.jsx';
import Nav from './navstuff/nav.jsx';
import MobileNav from './navstuff/MobileNav.jsx';
import Hotkeys from 'react-hot-keys';
import Head from 'next/head';

export default function NicePage({ children, isTerminalOpen, terminalOpener, selected, title }) {
  const closeTerminal = useRef();
  const [terminalOpen, setTerminalOpen] = useState(false);
  isTerminalOpen = terminalOpen;

  useEffect(() => {
    const handleClick = () => {
      setTerminalOpen(true);
    };

    if (terminalOpener) {
      const button = terminalOpener.current;

      if (button) {
        button.addEventListener('click', handleClick);
      }

      return () => {
        if (button) {
          button.removeEventListener('click', handleClick);
        }
      };
    }
  }, []);

  return (
    <div className='page overflow-x-hidden' onScroll={() => console.log('nicee')}>
      <Head>
        <title>Algobility {title ? '| ' + title : ''}</title>
      </Head>
      <Blob />
      <Hotkeys keyName='ctrl+space' onKeyDown={() => setTerminalOpen(!terminalOpen)}>
        <div className={`z-50 relative h-full w-screen overflow-x-hidden  ${terminalOpen ? 'opacity-20' : ''}`}>
          <div className='w-full h-full z-60 relative '>
            <Nav
              className='hidden lg:block'
              openTerminalCallback={() => {
                setTerminalOpen(true);
                console.log('clickki');
              }}
              selected={selected}
            ></Nav>
            <MobileNav className='lg:hidden' selected={selected}></MobileNav>
          </div>
          {children}
        </div>
      </Hotkeys>
      {terminalOpen ? <Terminal toOpen={terminalOpen} closeCallback={() => setTerminalOpen(false)}></Terminal> : ''}
    </div>
  );
}
