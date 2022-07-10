import React from 'react';

import Header from "./Header";
import Outline from './Outline';
import Page from './Page';
import Edition from '../../models/book/Edition'

const Unknown = (props: { book: Edition, message: React.ReactNode }) => {

	return (
		<Page>
			<Header 
				book={props.book}
				label="Unknown page title"
				getImage={() => props.book.getImage("unknown")}
				setImage={(embed) => props.book.setImage("unknown", embed)}
				header="Oops."
				outline={
					<Outline
						previous={null}
						next={null}
					/>
				}
			/>
			<p>{props.message}</p>
		</Page>
	)

}

export default Unknown;