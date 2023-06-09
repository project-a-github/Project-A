import firebase from '../firebaseConfig'; //needed
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument } from 'react-firebase-hooks/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDoc, where, get, query, doc, setDoc, getDocs, onSnapshot, getDocFromServer, addDoc, collection} from 'firebase/firestore';
import { useContext } from 'react';
import { useSignOut } from 'react-firebase-hooks/auth';


const db = getFirestore(firebase);
const loadingUserData = {
  name: 'Loading ...',
  username: 'Loading ...',
  email: 'Loading ...',
  pRank: 'Loading ...',
  cRank: 'loading',
  completed: []
}



const getStorage = async (collectionName, name) => {
  return new Promise(async (resolve, reject) => {
    const res = await getDocFromServer(doc(db, collectionName, name));
    try {
      if (res.exists) resolve(res.data());
      else {
        reject('User document does not exist');
      }
    } catch (err) {
      reject(`Error ${err}`);
    }
  });
};


const  queryStorageFieldExists = async (collectionName, field, value)=>{
  const querySnapshot = await getDocs(query(collection(db,collectionName), where(field, '==', value)))
  return !querySnapshot.empty;
}

export const queryUser = async(userName)=>{
  return new Promise(async (resolve, reject)=>{
    try {
      const querySnapshot = await getDocs(query(collection(db,'Users'), where('username', '==', userName)))
      const userData = querySnapshot.docs[0].data();
      return resolve(userData)
    } catch (error) {
      console.error('Error searching Firestore:', error);
      return reject({ error: 'Internal server error' + error })
    }
  })
}

const existsStorage = async (collectionName, name) => {
  return new Promise(async (resolve, reject) => {
    const documentRef = doc(db, 'Users', name);
    try {
      const document = await getDoc(documentRef);
      resolve(document.exists());
    } catch (error) {
      resolve(false);
    }
  });
};

const setStorage = async (collectionName, name, payload, overwrite=false) => {
  return new Promise(async (resolve, reject) => {
    const docRef = await doc(db, collectionName, name);
    try {
      const res = await setDoc(docRef, payload, { merge: !overwrite });
      resolve(res);
    } catch (err) {
      reject(`Error ${err}`);
    }
  });
};

const addStorage = async (collectionName, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await addDoc(collection(db, collectionName), payload)
      resolve(res.id);
    } catch (err) {
      reject(`Error ${err}`);
    }
  });
};

const mergeObjects = (obj1, obj2) => {
  return { ...obj1, ...obj2 };
};

const useUser = () => {
  const auth = getAuth();

  //init
  const [signOut, loadingSignOut, errorSignOut] = useSignOut(auth);
  const [user, loading] = useAuthState(auth);
  const [signedState, setSignedState] = useState(true);
  
  const [userData, setUserData] = useState(loadingUserData);

  const logoutUser = async ()=>{
    if(signedState){
      signOut().then(()=>{
        setSignedState(false)
        setUserData(loadingUserData)
        localStorage.removeItem('ud');
      }
      )
      .catch(()=>{
        alert('There was an error signing out')
      })
    }
  }

  const updateUserData = async (payload) => {
    new Promise(async (resolve, reject) => {
      try {
        const newUserData = mergeObjects(userData, payload);
        setUserData(newUserData);
        localStorage.setItem('ud', JSON.stringify(newUserData));
        setStorage('Users', user.uid, newUserData, false);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  };

  const forceFetch = async () => {
    return getUserData(true);
  };

  const getUserData = async (forceFetch) => {
    return new Promise(async (resolve, reject) => {
      try {
        const fetchLocal = await localStorage.getItem('ud');
        if (fetchLocal != null && !forceFetch) {
          console.log('got from loacl', JSON.parse(fetchLocal));
          setUserData(JSON.parse(fetchLocal));
        } else {
          const res = await getStorage('Users', user.uid);
          console.log('got from firestore: ', res);
          setUserData(res);
          localStorage.setItem('ud', JSON.stringify(res));
        }
        resolve();
      } catch (e) {
        console.log('Couldnt get user Data: ', e)
        reject(e);
      }
    });
  };

  useEffect(() => {
    if (user && userData.name === 'Loading ...') getUserData();
    if(!loading && !user) setSignedState(false)
  }, [loading]);

  return { userData, updateUserData, forceFetch, signedState, logoutUser };
};

export { useUser, getStorage, setStorage, existsStorage, mergeObjects, addStorage, queryStorageFieldExists};
