import React from 'react';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';
import Edition from '../../models/book/Edition'
import Instructions from './Instructions';
import ChapterIDs from '../../models/book/ChapterID';

const Unknown = (props: { book: Edition, message: React.ReactNode }) => {

	return (
		<Page>
			<Header 
				book={props.book}
				label="Unknown page title"
				getImage={() => props.book.getImage(ChapterIDs.UnknownID)}
				setImage={(embed) => props.book.setImage(ChapterIDs.UnknownID, embed)}
				header="Oops."
				outline={
					<Outline
						previous={null}
						next={null}
					/>
				}
			/>

			<Instructions>
				This page will be shown if the reader somehow ends up on a page that doesn't exist.
				You can customize the image shown.
			</Instructions>

			<p>{props.message}</p>
		</Page>
	)

}

export default Unknown;