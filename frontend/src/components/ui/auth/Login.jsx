import React, { useEffect, useState } from 'react';
import Navbar from "../shared/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { USER_API_END_POINT } from '../../../utils/constant';
import {toast} from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux'
import { setLoading } from '@/redux/authSlice'
import { Loader2 } from 'lucide-react'
import { setUser } from '@/redux/authSlice';

const Login = () => {
  const [input, setInput] = useState({
    email: "",
    password: "",
    role: "",
  });
  const {loading, user} = useSelector(store=>store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    setInput({...input, [e.target.name]:e.target.value});
  }

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
        dispatch(setLoading(true));
        const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
            headers:{
                "Content-Type": "application/json"
            },
            withCredentials: true,
        });
        if(res.data.success)
        {
            dispatch(setUser(res.data.user));
            navigate("/");
            toast.success(res.data.message);
        }
    } catch (error) {
        console.log("Login error:", error.response?.data || error.message);
        toast.error(error.response?.data?.message || "Login failed");
    } finally {
      dispatch(setLoading(false));
    }
  }
  useEffect(()=>{
    if(user)
    {
      navigate("/");
    }
  })

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <form onSubmit={submitHandler} className="w-1/2 border border-gray-200 rounded-md p-4 my-10">
          <h1 className="font-bold text-xl mb-7">Login</h1>
          <div className="my-4">
            <Label className="mb-1">Email</Label>
            <Input 
                type="email" 
                value = {input.email} 
                name="email"
                onChange = {changeEventHandler}
                placeholder="john.doe@gmail.com"
            />
          </div>
          <div className="my-4">
            <Label className="mb-1">Password</Label>
            <Input 
                type="password" 
                value = {input.password} 
                name="password"
                onChange = {changeEventHandler}
                placeholder="*******"
            />
          </div>
          <div className="flex items-center justify-between">
            <RadioGroup className="flex items-center gap-4 my-5">
              <div className="flex items-center space-x-2">
                <Input
                  type="radio"
                  name="role"
                  value="student"
                  checked={input.role==="student"}
                  onChange={changeEventHandler}
                  className="cursor-pointer"
                />
                <Label htmlFor="r1">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="radio"
                  name="role"
                  value="recruiter"
                  checked={input.role==="recruiter"}
                  onChange={changeEventHandler}
                  className="cursor-pointer"
                />
                <Label htmlFor="r2">Recruiter</Label>
              </div>
            </RadioGroup>
          </div>
          {
             loading ? <Button className="w-full my-4"> <Loader2 className="mr-2 h-4 animate-spin"/> Please Wait </Button> : <Button className="w-full my-4 cursor-pointer">Login</Button>
          }
          <span className="text-sm">
            Don't have an account? <Link to="/signup" className="text-blue-600">Sign Up</Link>
          </span>
        </form>
      </div>
    </div>
  );
};

export default Login;