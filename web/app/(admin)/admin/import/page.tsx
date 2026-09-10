'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import Button from '@/components/ui/Button'

const SEED = {
  customers: [
    { name: 'Vishwa', mobile: '8220710970' },
    { name: 'Tamil', mobile: '9360329755' },
    { name: 'Anjali', mobile: '9025374278' },
    { name: 'Arjit', mobile: '8124025297' },
    { name: 'Ragul', mobile: '9025008688' },
    { name: 'Riyas', mobile: '8189999299' },
    { name: 'Kishore', mobile: '9488561682' },
    { name: 'Krishna', mobile: '6381770152' },
    { name: 'Rithika', mobile: '7708196298' },
    { name: 'Mohan Dapsa', mobile: '9677996060' },
    { name: 'Pranesh', mobile: '8608662901' },
    { name: 'Bingo', mobile: '8610802674' },
    { name: 'Venkatesh', mobile: '9994246211' },
    { name: 'Amrish', mobile: '9994444322' },
    { name: 'Yashwanth', mobile: '6381014277' },
    { name: 'Tanish', mobile: '9342427315' },
    { name: 'Jason', mobile: '9894058215' },
    { name: 'Dharshan', mobile: '8072033526' },
    { name: 'Rakshana', mobile: '9345718815' },
    { name: 'Vimal', mobile: '9003833903' },
    { name: 'Yuvanesh', mobile: '8637658399' },
    { name: 'Sharvya', mobile: '6369447682' },
    { name: 'Sreeja', mobile: '9597448119' },
    { name: 'Karthi', mobile: '0000000001' }, // TODO: real mobile
  ],
  subscriptions: [
    {
      user_name: 'Vishwa', user_mobile: '8220710970', plan: 'lunch_dinner',
      start_date: '2026-09-04', end_date: '2026-09-10', lunch_price: 220, dinner_price: 170,
      rotation_enabled: true, rotation_applies_to: 'dinner', rotation_start_with: 'wrap',
      paid: false, delivered_through: '2026-09-09', skip: [{ date: '2026-09-07', meal_type: 'dinner' }],
    },
    {
      user_name: 'Tamil', user_mobile: '9360329755', plan: 'lunch_dinner',
      start_date: '2026-09-03', end_date: '2026-09-09', lunch_price: 199, dinner_price: 169,
      rotation_enabled: true, rotation_applies_to: 'dinner', rotation_start_with: 'wrap',
      paid: true, delivered_through: '2026-09-09',
    },
    // Arjit went daily-orders — remove his old subscriptions; lunches are individual orders below.
    { user_name: 'Arjit', user_mobile: '8124025297', plan: 'lunch', start_date: '2026-09-04', end_date: '2026-09-07', lunch_price: 159, delete: true },
    { user_name: 'Arjit', user_mobile: '8124025297', plan: 'lunch', start_date: '2026-09-08', end_date: '2026-09-11', lunch_price: 190, delete: true },
    // Vimal — ended dinner subscription, unpaid. Individual orders below are removed.
    {
      user_name: 'Vimal', user_mobile: '9003833903', plan: 'dinner',
      start_date: '2026-08-31', end_date: '2026-09-11', delivery_days: [1, 2, 3, 5], dinner_price: 130,
      rotation_enabled: true, rotation_applies_to: 'dinner', rotation_start_with: 'salad',
      paid: false, status: 'ended', delivered_through: '2026-09-11',
    },
    {
      user_name: 'Ragul', user_mobile: '9025008688', plan: 'lunch',
      start_date: '2026-08-29', end_date: '2026-09-04', lunch_price: 159, paid: true,
      status: 'ended', delivered_through: '2026-09-04',
    },
    {
      // Sep 10 & 11 meals were both handed over on Wed Sep 9 — treat all 6 as delivered.
      user_name: 'Ragul', user_mobile: '9025008688', plan: 'lunch',
      start_date: '2026-09-05', end_date: '2026-09-11', lunch_price: 159, paid: true,
      status: 'ended', delivered_through: '2026-09-11',
    },
    {
      // Sub 3 — new, from Sep 10, 6 delivery days (Sep 10, 11, 12, 14, 15, 16).
      user_name: 'Ragul', user_mobile: '9025008688', plan: 'lunch',
      start_date: '2026-09-10', end_date: '2026-09-16', lunch_price: 169, paid: false,
      status: 'active', delivered_through: '2026-09-11',
    },
  ],
  orders: [
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-07', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-08', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 130, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-09', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-10', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, paid: false, delivery_state: 'delivered', replace: true }, // plan stopped — regular ₹160
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-11', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, paid: false, delete: true }, // Anjali stopped
    { customer_name: 'Vishwa', customer_mobile: '8220710970', date: '2026-09-11', meal_type: 'dinner', meal_variant: 'wrap', amount: 170, paid: false, notes: 'Make-up for Sep 7 dinner' },

    // Walk-in / one-off orders — all paid, all delivered
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-08-29', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 150, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-08-29', meal_type: 'dinner', meal_variant: 'salad', amount: 150, quantity: 3, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-08-29', meal_type: 'dinner', meal_variant: 'wrap', amount: 120, quantity: 3, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-08-31', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-08-31', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-08-31', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Nandhini', customer_mobile: '9629162288', date: '2026-08-29', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Mohan coach', customer_mobile: '7373994232', date: '2026-08-31', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Vignesh Ravikumar', customer_mobile: '9444872677', date: '2026-09-01', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-02', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-04', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered', replace: true },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-05', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered', replace: true },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-07', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered', replace: true },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-08', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 190, quantity: 1, paid: true, delivery_state: 'delivered', replace: true },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-09', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 190, quantity: 1, paid: true, delivery_state: 'delivered', replace: true },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-10', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered', replace: true },
    { customer_name: 'Riyas', customer_mobile: '8189999299', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },

    // Batch 3
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-02', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'salad', amount: 129, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'wrap', amount: 129, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Krishna', customer_mobile: '6381770152', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'salad', amount: 140, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Krishna', customer_mobile: '6381770152', date: '2026-09-04', meal_type: 'dinner', meal_variant: 'salad', amount: 150, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Mohan Dapsa', customer_mobile: '9677996060', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Rithika', customer_mobile: '7708196298', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'salad', amount: 140, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Rithika', customer_mobile: '7708196298', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-09-02', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 140, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-09-02', meal_type: 'dinner', meal_variant: 'salad', amount: 140, quantity: 1, paid: true, delivery_state: 'delivered' },

    // Batch 4 — all Sep 5, paid + delivered
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-05', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 185, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 140, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'wrap', amount: 120, quantity: 3, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Pranesh', customer_mobile: '8608662901', date: '2026-09-05', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Pranesh', customer_mobile: '8608662901', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Bingo', customer_mobile: '8610802674', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 150, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Venkatesh', customer_mobile: '9994246211', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 134, quantity: 3, paid: true, delivery_state: 'delivered', replace: true },
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'wrap', amount: 129, quantity: 2, paid: true, delivery_state: 'delivered', replace: true },

    // Batch 5
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-07', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Krishna', customer_mobile: '6381770152', date: '2026-09-07', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Amrish', customer_mobile: '9994444322', date: '2026-09-06', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 2, paid: true, delivery_state: 'delivered' },

    // Batch 6
    { customer_name: 'Bingo', customer_mobile: '8610802674', date: '2026-09-08', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-08', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-08', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Yashwanth', customer_mobile: '6381014277', date: '2026-09-06', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Yashwanth', customer_mobile: '6381014277', date: '2026-09-08', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Tanish', customer_mobile: '9342427315', date: '2026-09-06', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Tanish', customer_mobile: '9342427315', date: '2026-09-08', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Tanish', customer_mobile: '9342427315', date: '2026-09-09', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Jason', customer_mobile: '9894058215', date: '2026-09-08', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Jason', customer_mobile: '9894058215', date: '2026-09-09', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Dharshan', customer_mobile: '8072033526', date: '2026-09-08', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Dharshan', customer_mobile: '8072033526', date: '2026-09-08', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 4, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Dharshan', customer_mobile: '8072033526', date: '2026-09-09', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 3, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Dharshan', customer_mobile: '8072033526', date: '2026-09-09', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },

    // Batch 7
    { customer_name: 'Rakshana', customer_mobile: '9345718815', date: '2026-09-07', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Rakshana', customer_mobile: '9345718815', date: '2026-09-07', meal_type: 'dinner', meal_variant: 'wrap', amount: 140, quantity: 1, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Rakshana', customer_mobile: '9345718815', date: '2026-09-09', meal_type: 'dinner', meal_variant: 'wrap', amount: 140, quantity: 2, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Rakshana', customer_mobile: '9345718815', date: '2026-09-09', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Pranesh', customer_mobile: '8608662901', date: '2026-09-09', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 249, quantity: 1, paid: true, delivery_state: 'delivered' },

    // Vimal — individual orders removed; now the ended subscription above
    { customer_name: 'Vimal', customer_mobile: '9003833903', date: '2026-08-31', meal_type: 'dinner', meal_variant: 'salad', amount: 130, delete: true },
    { customer_name: 'Vimal', customer_mobile: '9003833903', date: '2026-09-01', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, delete: true },
    { customer_name: 'Vimal', customer_mobile: '9003833903', date: '2026-09-02', meal_type: 'dinner', meal_variant: 'salad', amount: 130, delete: true },
    { customer_name: 'Vimal', customer_mobile: '9003833903', date: '2026-09-04', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, delete: true },
    { customer_name: 'Vimal', customer_mobile: '9003833903', date: '2026-09-07', meal_type: 'dinner', meal_variant: 'salad', amount: 130, delete: true },
    { customer_name: 'Vimal', customer_mobile: '9003833903', date: '2026-09-08', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, delete: true },
    { customer_name: 'Vimal', customer_mobile: '9003833903', date: '2026-09-09', meal_type: 'dinner', meal_variant: 'salad', amount: 130, delete: true },
    { customer_name: 'Vimal', customer_mobile: '9003833903', date: '2026-09-11', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, delete: true },

    // Batch 9 — Sep 9
    { customer_name: 'Yuvanesh', customer_mobile: '8637658399', date: '2026-09-09', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 150, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Sharvya', customer_mobile: '6369447682', date: '2026-09-09', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 185, quantity: 1, paid: false, delivery_state: 'delivered', replace: true },
    { customer_name: 'Sreeja', customer_mobile: '9597448119', date: '2026-08-29', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 2, paid: true, delivery_state: 'delivered' },

    // Karthi — ₹500 advance, fully used
    { customer_name: 'Karthi', customer_mobile: '0000000001', date: '2026-09-02', meal_type: 'dinner', meal_variant: 'wrap', amount: 120, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Karthi', customer_mobile: '0000000001', date: '2026-09-08', meal_type: 'dinner', meal_variant: 'wrap', amount: 120, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Karthi', customer_mobile: '0000000001', date: '2026-09-10', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 2, paid: true, delivery_state: 'delivered' },

    // Sep 10 — Anjali extras on top of her subscription lunch
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-10', meal_type: 'dinner', meal_variant: 'salad', amount: 145, quantity: 1, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-10', meal_type: 'dinner', meal_variant: 'wrap', amount: 150, quantity: 1, paid: false, delivery_state: 'delivered' },
  ],
  expenses: [
    // 26 Aug – 2 Sep (no per-day breakdown given — bucketed on Aug 26)
    { date: '2026-08-26', category: 'chicken', description: 'chicken', amount: 2100 },
    { date: '2026-08-26', category: 'groceries', description: 'corn', amount: 200 },
    { date: '2026-08-26', category: 'groceries', description: 'veggies', amount: 250 },
    { date: '2026-08-26', category: 'packaging', description: 'packing', amount: 1165 },
    { date: '2026-08-26', category: 'packaging', description: 'stickers', amount: 200 },
    { date: '2026-08-26', category: 'groceries', description: 'groceries', amount: 1978 },
    // 2 Sep
    { date: '2026-09-02', category: 'chicken', description: 'chicken', amount: 525 },
    { date: '2026-09-02', category: 'groceries', description: 'yogurt & lettuce', amount: 400 },
    // 3 Sep
    { date: '2026-09-03', category: 'chicken', description: 'chicken', amount: 1300 },
    { date: '2026-09-03', category: 'groceries', description: 'corn', amount: 100 },
    // 4 Sep
    { date: '2026-09-04', category: 'groceries', description: 'corn', amount: 100 },
    { date: '2026-09-04', category: 'chicken', description: 'chicken', amount: 525 },
    { date: '2026-09-04', category: 'chicken', description: 'chicken (2)', amount: 900 },
    { date: '2026-09-04', category: 'groceries', description: 'groceries', amount: 225 },
    { date: '2026-09-04', category: 'packaging', description: 'packing', amount: 90 },
    { date: '2026-09-04', category: 'groceries', description: 'veggies & egg', amount: 56 },
    { date: '2026-09-04', category: 'packaging', description: 'packing (2)', amount: 350 },
    // 5 Sep
    { date: '2026-09-05', category: 'chicken', description: 'chicken', amount: 525 },
    // 7 Sep
    { date: '2026-09-07', category: 'chicken', description: 'chicken & corn', amount: 800 },
    { date: '2026-09-07', category: 'groceries', description: 'yogurt', amount: 250 },
    { date: '2026-09-07', category: 'chicken', description: 'chicken', amount: 560 },
    { date: '2026-09-07', category: 'groceries', description: 'curd', amount: 40 },
    { date: '2026-09-07', category: 'packaging', description: 'packing', amount: 250 },
    // 8 Sep
    { date: '2026-09-08', category: 'groceries', description: 'paneer & lettuce', amount: 200 },
    { date: '2026-09-08', category: 'chicken', description: 'chicken', amount: 300 },
    { date: '2026-09-08', category: 'delivery', description: 'delivery', amount: 300 },
    // 9 Sep
    { date: '2026-09-09', category: 'groceries', description: 'groceries', amount: 175 },
    { date: '2026-09-09', category: 'packaging', description: 'packing', amount: 980 },
    { date: '2026-09-09', category: 'chicken', description: 'chicken', amount: 410 },
    { date: '2026-09-09', category: 'chicken', description: 'chicken (2)', amount: 290 },
    { date: '2026-09-09', category: 'groceries', description: 'groceries (2)', amount: 975 },
    { date: '2026-09-09', category: 'chicken', description: 'chicken (3)', amount: 789 },
  ],
}

export default function AdminImportPage() {
  const [text, setText] = useState(JSON.stringify(SEED, null, 2))
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    setResult(null)
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      setResult('❌ Invalid JSON')
      return
    }
    setBusy(true)
    try {
      const { obj, message } = await api.post<Record<string, unknown>>('/api/admin/import/legacy', payload)
      setResult(`✅ ${message}\n\n${JSON.stringify(obj, null, 2)}`)
    } catch (e) {
      setResult(`❌ ${e instanceof ApiError ? e.message : 'Import failed'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Import</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Paste an import payload and run it. Safe to run twice — customers dedupe by mobile, orders by
        customer+date+meal, subscriptions by customer+plan+dates, expenses by exact match.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="mt-4 h-[420px] w-full rounded-2xl border-2 border-cream-deep bg-white p-4 font-mono text-xs text-ink outline-none focus:border-green"
      />

      <div className="mt-3">
        <Button onClick={run} loading={busy}>
          Run import
        </Button>
      </div>

      {result && (
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-cream-soft p-4 text-xs text-ink">
          {result}
        </pre>
      )}
    </div>
  )
}
