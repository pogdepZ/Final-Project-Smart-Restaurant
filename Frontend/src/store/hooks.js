import { useDispatch, useSelector } from 'react-redux';

// Custom hooks để sử dụng Redux store dễ dàng hơn
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
