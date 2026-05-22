# AgroMind Platform — Project Requirements Document
## AI-Driven Market Intelligence & Farmer Supply Optimization

**Document Version:** 2.0  
**Date:** April 30, 2026  
**Focus:** Market Supply Prediction + Farmer Income Optimization

---

## Table of Contents

1. Executive Summary
2. Core Problem Statement
3. Platform Objectives
4. Feature Requirements
5. Technical Architecture
6. Data Models
7. AI/ML Requirements
8. User Workflows
9. Phase-wise Roadmap
10. Success Metrics

---

## 1. Executive Summary

AgroMind is a market-intelligence platform designed to solve the critical problem of agricultural market inefficiency in India. The platform uses real-time supply data, predictive analytics, and farmer location intelligence to help farmers make optimal decisions about:

- When to transport crops to market (avoid oversupply days)
- How much to transport daily (maximize price realization)
- Which market hub to target (by proximity & demand)
- Storage vs. sell decisions (when to hold for better prices)

By creating transparency around daily market arrivals, pricing patterns, and regional supply clusters, AgroMind enables farmers to collectively optimize their selling patterns, reducing price volatility and increasing average farm incomes by 20–35%.

---

## 2. Core Problem Statement

### Farmer Pain Points

- Oversupply days drive down prices by 30–50%
- Farmers lack accurate daily market arrival and price information
- Individual decisions create herd behavior and price crashes
- Farmers cannot see nearby supply levels or coordinate transport
- Storage decisions are made without market context

### Root Causes

- No real-time mandi transparency
- No coordinated supply prediction or demand modeling
- Lack of nearby farmer cluster visibility
- Missing application-level guidance for sell/hold decisions

---

## 3. Platform Objectives

### Primary Objective
Enable coordinated, data-driven selling decisions that optimize farmer income while stabilizing market prices.

### Secondary Objectives

- Reduce price volatility by 25–35%
- Increase average farmer income by 20–30%
- Reduce post-harvest losses from 20% to below 5%
- Improve farmer coordination and storage planning
- Deliver daily guidance on whether to bring vegetables to market

---

## 4. Feature Requirements

### Farmer Login

- Personal login page for farmer authentication
- Mobile OTP + farm key or Aadhaar-based identity
- Farmer profile includes crop types, farm location, preferred mandi, and stock limits

### Market Dashboard

- Real-time daily arrivals for key vegetables (Onion, Tomato, Potato, etc.)
- Opening and closing price tracking for mandis
- Farmer-specific stock position: on farm and in storage
- Nearby 100km cluster stock visibility
- Daily transport recommendation quantity for highest rate
- Supply shortage/oversupply alerts for the market
- Sell/hold guidance based on AI prediction

### Prediction and Guidance

- 7-day demand/supply forecast for mandis
- Recommend daily transport volume to avoid oversupply
- Analyze required daily market supply for price balance
- Inform farmers whether to bring vegetables today or hold
- Help create artificial shortage to preserve price levels

---

## 5. Technical Architecture

### Core Stack

- Frontend: React Web + React Native (future mobile app)
- Backend: FastAPI (Python)
- Database: PostgreSQL + Redis for caching
- Forecasting: Prophet + XGBoost
- LLM/Text: Mistral 7B for recommendations
- Data integration: Agmarknet, APEDA, IMD weather APIs

### System Components

- Auth Service
- Farmer Profile Service
- Market Data Service
- Prediction Service
- Stock and Storage Service
- Location/Cluster Service
- Social and Coordination Service

---

## 6. Data Models

### Farmer Profile

- name, phone, location, crop details, stock levels
- cold storage capacity, preferred mandi

### Market Daily Data

- mandi, crop, opening price, closing price, arrivals, predicted price range

### Farmer Inventory

- current stock, grade, storage location, harvest date, freshness

### Prediction Record

- forecast date, predicted arrivals, confidence, recommendation

---

## 7. AI/ML Requirements

- Supply forecasting with Prophet + XGBoost ensemble
- Price prediction with demand and weather inputs
- Recommendation engine for sell/hold decisions
- Location clustering to aggregate nearby farmer supply
- Translation and explanation of AI guidance

---

## 8. User Workflows

### Farmer Daily Workflow

1. Login and review today’s market dashboard
2. Check arrivals, open/close prices, and cluster stock
3. Receive AI recommendation on how much to transport
4. Decide whether to sell now or hold stock
5. Update stock and monitor next-day forecast

---

## 9. Phase-wise Roadmap

### MVP (Months 1–4)

- Farmer login and dashboard
- Real-time market arrivals and pricing
- Local stock tracking and cluster visibility
- Initial prediction service with supply guidance
- Closed beta with 500 farmers

### Growth (Months 5–8)

- Expand to 5,000 farmers
- Add more crops and mandis
- Improve prediction accuracy
- Add cooperative storage and pooling features

### Scale (Months 9–16)

- Launch direct buyer marketplace
- Add credit scoring and insurance
- Expand to multiple states
- Monetize with premium analytics

---

## 10. Success Metrics

- Active farmers: 5,000 (MVP)
- Prediction accuracy: MAPE < 12%
- Average income increase: +22%
- Price volatility reduction: 25–35%
- Recommendation adoption rate: 35%+

---

**Status:** Ready for implementation
