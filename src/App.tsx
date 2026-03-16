import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CartProvider } from './modules/cart/cartStore';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { EnergyCalculatorPage } from './pages/EnergyCalculatorPage';
import { HeatPumpsPage } from './pages/HeatPumpsPage';
import { HydronicHeatingPage } from './pages/HydronicHeatingPage';
import { ConsultingPage } from './pages/ConsultingPage';
import { WebshopPage } from './pages/WebshopPage';
import { ContactPage } from './pages/ContactPage';
import { ProductDetailPage } from './pages/ProductDetailPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'energy-calculator', element: <EnergyCalculatorPage /> },
      { path: 'heat-pumps', element: <HeatPumpsPage /> },
      { path: 'hydronic-heating', element: <HydronicHeatingPage /> },
      { path: 'consulting', element: <ConsultingPage /> },
      { path: 'webshop', element: <WebshopPage /> },
      { path: 'webshop/:productNumber', element: <ProductDetailPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

export default function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}
