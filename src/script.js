import App from './App'
import { inject } from "@vercel/analytics"
import { injectSpeedInsights } from '@vercel/speed-insights'

injectSpeedInsights()
inject()
const canvas = document.querySelector('.webgl')
const app = new App(canvas)
