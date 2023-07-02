'use client'

import {useEffect, useState} from "react";
import {toast} from "react-toastify";

export default function About() {
  const [name, setName] = useState('');

  const saveStateToLocalStorage = (key, state) => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      console.log("Data stored")
    } catch (error) {
      // Handle Local Storage errors
      toast.error(`Error saving state '${key}' to Local Storage:`, error);
    }
  };

  const loadStateFromLocalStorage = (key, defaultValue) => {
    try {
      const storedState = localStorage.getItem(key);
      console.log(storedState)
      if (storedState) {
        return JSON.parse(storedState);
      }
    } catch (error) {
      toast.error(`Error loading state '${key}' from Local Storage:`, error);
    }
    return defaultValue;
  };

  useEffect(() => {
    if (name){
      saveStateToLocalStorage('name', name)
    }
  }, [name])

  useEffect(() => {
    let load_name = loadStateFromLocalStorage('name', '')
    console.log(load_name)
  }, [])

  return (
    <div>
      <p>This is about page</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        className="border border-gray-300 px-4 py-2 rounded mr-2"
      />
      <span>Name: {name}</span>
    </div>
  )
}
