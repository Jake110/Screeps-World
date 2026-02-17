"""
A utility script to fix the issue of not being able to
highlight code or use the clipboard on mobile
"""

from argparse import ArgumentParser
from copy import copy as copy_obj
from logging import basicConfig, getLogger, INFO
from pathlib import Path
from re import DOTALL, findall, MULTILINE, search, sub, subn

from ast import literal_eval

logger = getLogger(name="Clipboard")
basicConfig(level=INFO)


def find_tag_path(tag: str, multi: bool = False) -> list[str] | str:
    """
    Find which project file the given tag is in.

    Args:
        tag (str): The name of the tag.
        multi (bool): Flag for allowing multiple instances to be found.

    Raises:
        ValueError: Thrown if multiple instances of the tag are found in the project
        ValueError: thrown if the tag was not found in the project.

    Returns:
        list[str] | str: The path/s to the file the tag was found in.
    """
    path_list = []
    path = Path(__file__).parent
    for folder_path, _, file_names in path.walk():
        skip_folder = False
        for folder in str(folder_path).split("/"):
            if folder.startswith(".") or folder == "__pycache__":
                skip_folder = True
                break
        if skip_folder:
            continue
        for file_name in file_names:
            if file_name.endswith(".deb"):
                continue
            file_path = Path(folder_path, file_name)
            if f"{file_path}" == __file__:
                continue
            with file_path.open(mode="r", encoding="utf-8") as file_object:
                for _ in findall(pattern=f"{tag}", string=file_object.read()):
                    if multi and str(file_path) in path_list:
                        continue
                    path_list.append(f"{file_path}")
    if not path_list:
        raise ValueError(f"[{tag}] was not found")
    if multi:
        return path_list
    if len(path_list) > 1:
        raise ValueError(
            f"Multiple instances of [{tag}] found. Ensure there is only 1.\n{path_list}"
        )
    return path_list[0]


def find_tag_pair_path(tag1: str, tag2: str) -> str:
    """
    Find which project file the given tag pair are found in

    Args:
        tag1 (str): the first tag
        tag2 (str): the second tag

    Raises:
        ValueError: thrown if the tags are found in different files

    Returns:
        str: the path to the file the tag pair was found in
    """
    path1 = find_tag_path(tag=tag1)
    path2 = find_tag_path(tag=tag2)
    if path1 != path2:
        raise ValueError(
            f"The two tags need to be in the same file."
            f"\n[{tag1}] in [{path1}]"
            f"\n[{tag2}] in [{path2}]"
        )
    return path1


def get_tag(start: str, end: str) -> str:
    """
    Build a tag marker with the given pair of labels

    Args:
        start (str): the first tag label
        end (str): the second tag label

    Returns:
        str: the built tag
    """
    return f"# {start}-{end}"


def get_tag_pair(tag_name: str) -> tuple[str]:
    """
    Build the start and end tags for a given tag name

    Args:
        tag_name (str): name of the tag to build a pair for

    Returns:
        tuple[str]: the built start and end tag
    """
    return (get_tag(start=tag_name, end="start"), get_tag(start=tag_name, end="end"))


def copy(tag_name: str = "copy"):
    """
    Copy and paste everything within the tag pair

    Args:
        tag_name (str, optional): name of the tag pair to use. Defaults to "copy".

    Raises:
        ValueError: thrown if the string copied cannot be tab corrected properly
    """

    def _copy(tag_name: str, start_tag: str, end_tag: str):
        logger.info(msg=f"Copying from [{copy_target}]")
        with Path(copy_target).open(mode="r", encoding="utf-8") as file_object:
            source_contents = file_object.read()
        match = search(
            pattern=rf"(\s*){start_tag}((?s:.)*){end_tag}",
            string=source_contents,
            flags=MULTILINE,
        )
        copied_string = match.group(2)
        if tag_name == "copy":
            source_contents = source_contents.replace(start_tag, "").replace(
                end_tag, ""
            )
            with Path(copy_target).open(mode="w", encoding="utf-8") as file_object:
                file_object.write(source_contents)
        return copied_string, match.group(1)

    def _paste(paste_tag: str, paste_list: list[str], copied: str, copy_tabs: str):
        for paste_target in paste_list:
            copied_string = copy_obj(copied)
            logger.info(msg=f"Pasting to [{paste_target}]")
            with Path(paste_target).open(mode="r", encoding="utf-8") as file_object:
                contents = file_object.read()
            tab = " " * 4
            adjust_tabs = len(
                findall(
                    pattern=tab,
                    string=search(
                        pattern=rf"(\s*){paste_tag}", string=contents, flags=MULTILINE
                    ).group(1),
                )
            ) - len(findall(pattern=tab, string=copy_tabs))
            if adjust_tabs != 0:
                pattern = r"\n"
                newlines = len(findall(pattern=pattern, string=copied_string))
                replace = r"\n"
                if adjust_tabs > 0:
                    replace += tab * adjust_tabs
                else:
                    pattern += tab * (adjust_tabs * -1)
                    # newlines -= 2
                copied_string, updates = subn(
                    pattern=pattern, repl=replace, string=copied_string
                )
                if updates != newlines:
                    raise ValueError(
                        f"{updates}/{newlines} lines updated. "
                        "Ensure start tag is the least indented"
                    )
            # need to convert string to a representational string
            ## and then back to a literal to avoid errors regarding regex
            # literal newline and tab characters in string need
            ## to be slashed out to remain literal versions
            new_contents = sub(
                pattern=paste_tag,
                repl=repr(copied_string.replace(r"\n", r"\\n").replace(r"\t", r"\\t"))[
                    1:-1
                ],
                string=repr(contents),
            )
            with Path(paste_target).open(mode="w", encoding="utf-8") as file_object:
                file_object.write(
                    literal_eval(f"''{new_contents}''")
                    .replace(r"\\n", r"\n")
                    .replace(r"\\t", r"\t")
                )
        logger.info(msg="Paste complete")

    start_tag, end_tag = get_tag_pair(tag_name=tag_name)
    copy_target = find_tag_pair_path(tag1=start_tag, tag2=end_tag)
    paste_tag = get_tag(start="paste", end="here")
    paste_list = find_tag_path(tag=paste_tag, multi=True)
    copied_string, copy_tabs = _copy(
        tag_name=tag_name, start_tag=start_tag, end_tag=end_tag
    )
    _paste(
        paste_tag=paste_tag,
        paste_list=paste_list,
        copied=copied_string,
        copy_tabs=copy_tabs,
    )


def cut(tag_name: str = "cut"):
    """
    Cut and paste everything within the tag pair

    Args:
        tag_name (str, optional): name of the tag pair to use. Defaults to "cut".
    """
    copy(tag_name=tag_name)
    delete(tag_name=tag_name)


def delete(tag_name: str = "delete"):
    """
    Delete everything within the tag pair

    Args:
        tag_name (str, optional): name of the tag pair to use. Defaults to "delete".
    """
    start_tag, end_tag = get_tag_pair(tag_name=tag_name)
    target = find_tag_pair_path(tag1=start_tag, tag2=end_tag)
    logger.info(msg=f"Deleting from [{target}]")
    with Path(target).open(mode="r", encoding="utf-8") as file_object:
        contents = sub(
            pattern=rf"{start_tag}.*{end_tag}",
            repl="",
            string=file_object.read(),
            flags=DOTALL,
        )
    with Path(target).open(mode="w", encoding="utf-8") as file_object:
        file_object.write(contents)
    logger.info(msg="Delete complete")


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument(
        "-c",
        "--copy",
        action="store_true",
        help=(
            "Copy everything from [# copy-start] to [# copy-end] "
            "and paste it at the location of [# paste-here]"
        ),
    )
    parser.add_argument(
        "-C",
        "--cut",
        action="store_true",
        help=(
            "Cut everything from [# cut-start] to [# cut-end] "
            "and paste it at the location of [# paste-here]"
        ),
    )
    parser.add_argument(
        "-d",
        "--delete",
        action="store_true",
        help="Deletes everything from [# delete-start] to [# delete-end]",
    )

    args = parser.parse_args()

    if (args.copy and (args.cut or args.delete)) or (args.cut and args.delete):
        raise ValueError(
            "Only one option can be used at a time, either Copy, Cut or Delete"
        )

    if args.copy:
        copy()
    if args.cut:
        cut()
    if args.delete:
        delete()
    cut()
