import { DocumentReference } from "firebase/firestore";

export type BookSpecification = {
    ref: DocumentReference;
    title: string;
    authors: string[];
    description: string;
};

export default class Book {

    readonly spec: BookSpecification;

    constructor(spec: BookSpecification) {

        this.spec = spec;

    }

}