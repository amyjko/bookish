import React, { useContext } from 'react';
import Header from "./Header";
import Outline from './Outline';
import Page from './Page';
import Book, { Theme, defaultTheme } from '../../models/Book'
import Parser from '../../models/Parser';
import { renderNode } from '../chapter/Renderer';
import Switch from '../editor/Switch';
import TextEditor from '../editor/TextEditor';
import { DarkModeContext, EditorContext } from './Book';

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

const VariableEditor = ( props: { group: string, name: string, value: string }) => {

	const { group, name, value } = props;
	const { book } = useContext(EditorContext);
	if(book === undefined) return <span>{ value }</span>;

	return <tr>
		<td>{name.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ").map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(" ")}</td>
		<td style={{ textAlign: "right"}}>
			<TextEditor 
				text={value} 
				label={`${name} editor`} 
				save={text => book.setThemeValue(group, name, text)}>
				{ value }
			</TextEditor>
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

const Theme = (props: { book: Book }) => {

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

			<Switch 
				options={["Default", "Custom"]} 
				value={theme == undefined ? "Default" : "Custom"} 
				edit={custom => book.setTheme(custom === "Default" ? null : defaultTheme)}
			/>
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