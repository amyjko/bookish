import React, { useContext } from 'react';
import Header from "./Header";
import Outline from './Outline';
import Page from './Page';
import Edition from '../../models/book/Edition'
import { Theme, defaultTheme } from '../../models/book/Theme'
import Parser from '../../models/chapter/Parser';
import { renderNode } from '../chapter/Renderer';
import TextEditor from '../editor/TextEditor';
import { DarkModeContext, EditorContext } from './Edition';
import ConfirmButton from '../editor/ConfirmButton';

const Preview = (props: { theme: Theme }) => {

	const { darkMode } = useContext(DarkModeContext);

	const preview = Parser.parseChapter(undefined, `
		# Header 1
		## Header 2
		### Header 3
		
		This is how a sentence with _various_ *formatting* ^will^ look.

		* How does it look?
		* Would you change anything?	
	`);

	return <div className="bookish-theme-preview" style={{ backgroundColor: darkMode? props.theme.dark.backgroundColor : props.theme.light.backgroundColor }}>
		{ renderNode(preview) }
	</div>
}

const placeholders = {
	light: "CSS color",
	dark: "CSS color",
	fonts: "CSS font name",
	sizes: "CSS font size",
	weights: "CSS font weights",
	spacing: "CSS length"
};

const VariableEditor = ( props: { group: string, name: string, value: string }) => {

	const { group, name, value } = props;
	const { edition: book } = useContext(EditorContext);
	if(book === undefined) return <span>{ value }</span>;

	return <tr>
		<td>{name.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ").map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(" ")}</td>
		<td style={{ textAlign: "right"}}>
			<TextEditor 
				text={value} 
				label={`${name} editor`}
				placeholder={group in placeholders ? (placeholders as Record<string,string>)[group] : "value"}
				valid={ text => undefined }
				save={text => book.setThemeValue(group, name, text)}
			/>
		</td>
	</tr>

};

const ThemeSetEditor = ( props: { header: string, group: string, theme: Record<string, Record<string,string>>}) => {

	const { header, group, theme } = props;
	const set = theme[group];

	return <>
		<h2>{header}</h2>
		<div className="bookish-table">
			<table>
				<tbody>
				{
					Object.keys(set).sort().map((name, index) => <VariableEditor key={index} group={group} name={name} value={set[name]} />)
				}
				</tbody>
			</table>
		</div>
	</>
};

const Theme = (props: { book: Edition }) => {

	const { book } = props;

	const theme = book.getTheme();

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

			{
				theme === null ?
					<button onClick={() => book.setTheme(defaultTheme)}>Customize</button> :
					<ConfirmButton
						commandLabel="Revert to default"
						confirmLabel="Delete your theme?"
						command={() => book.setTheme(null)}
					/>
			}
			{
				theme !== null ?
					<>
						<Preview theme={theme}/>
						<ThemeSetEditor header={"Light mode colors"} group="light" theme={theme} />
						<ThemeSetEditor header={"Dark mode colors"} group="dark" theme={theme} />
						<ThemeSetEditor header={"Fonts"} group="fonts" theme={theme} />
						<ThemeSetEditor header={"Font sizes"} group="sizes" theme={theme} />
						<ThemeSetEditor header={"Font weights"} group="weights" theme={theme} />
						<ThemeSetEditor header={"Spacing"} group="spacing" theme={theme} />
					</> : null
			}

		</Page>
	)

}

export default Theme;