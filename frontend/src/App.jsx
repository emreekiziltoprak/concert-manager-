import './App.css'


import  Header from './page/Header'
import Categories from './page/Categories'
import Users from './page/Users'
import Events from './page/Events'
import CheckoutPage from './page/CheckoutPage'
import PaymentSuccessPage from './page/PaymentSuccessPage'
import EventDetail from './page/EventDetail'
import MyCart from './page/MyCart'
import Profile from './page/Profile'
import { BrowserRouter, Route, Routes } from 'react-router'
import MainLayout from './layout/MainLayout'
import AuthPage from './page/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './authContext/authcontext'
import { CartProvider } from './context/cartContext'

function App() {
  return (
    <AuthProvider>
    <CartProvider>
    <BrowserRouter>

<Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<AuthPage/>} />
      <Route path="/checkout" element={<CheckoutPage/>} />
      <Route path="/payment-success" element={<PaymentSuccessPage/>} />
      
       {/* PROTECTED AREA */}
       <Route element={<ProtectedRoute />}>
       <Route element={<MainLayout/>}>
       
        <Route path='/' element={<Events/>} />
         <Route path="/events" element={<Events/>} />
         <Route path="/event/:eventId" element={<EventDetail/>} />
         <Route path="/my-cart" element={<MyCart/>} />
         <Route path='/users' element={<Users/>} />
         <Route path='/categories' element={<Categories/>} />
         <Route path='/profile' element={<Profile/>} />
       </Route>
       </Route>

      </Routes>

    </BrowserRouter>
    </CartProvider>
</AuthProvider>
  )
}

export default App