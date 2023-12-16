import type { User } from 'firebase/auth';

type Authentication = {
    user: User | null;
    loading: boolean;
    login: Function;
    logout: Function;
};

export type { Authentication as default };
