import React from 'react';
import Header from "./Header";
import Outline from './Outline';
import Page from './Page';
import Book from '../../models/Book'
import Parser from '../../models/Parser';
import { renderNode } from '../chapter/Renderer';

const Preview = (props: {}) => {

	const preview = Parser.parseChapter(undefined, `
		# Header 1
		## Header 2
		### Header 3
		
		This is how a sentence with _various_ *formatting* ^will^ look.

		* How does it look?
		* Would you change anything?	
	`);

	return <>
		<hr/>
		{ renderNode(preview) }
		<hr/>
	</>
}

const Theme = (props: { book: Book }) => {

	return (
		<Page>
			<Header 
				book={props.book}
				label="Theme"
				getImage={() => undefined}
				setImage={(embed) => undefined}
				header="Theme"
				outline={
					<Outline
						previous={null}
						next={null}
					/>
				}
			/>
			
			<p>This is the theme editor. You can use it to choose from existing themes or create a custom theme for your book.</p>
			<Preview/>

		</Page>
	)

}

export default Theme;