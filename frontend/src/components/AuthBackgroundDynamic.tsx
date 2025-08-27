import dynamic from 'next/dynamic';

const AuthBackground = dynamic(() => import('./AuthBackground'), {
  ssr: false,
});

export default AuthBackground;