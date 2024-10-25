/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid */
import React from "react";
import clsx from "clsx";
import { Dropdown } from "react-bootstrap";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { toAbsoluteUrl } from "../../../../_helpers";
import { useLang, setLanguage } from "../../../../i18n";
import { DropdownTopbarItemToggler } from "../../../../_partials/dropdowns";
import { useIntl } from "react-intl";

const languages = [
  {
    lang: "vi",
    name: "Tiếng Việt",
    flag: toAbsoluteUrl("/media/svg/flags/220-vietnam.svg"),
  },
  {
    lang: "en",
    name: "English",
    flag: toAbsoluteUrl("/media/svg/flags/260-united-kingdom.svg"),
  },
];

export function LanguageSelectorDropdown({ showName = false }) {
  const { formatMessage } = useIntl();
  const lang = useLang();
  const currentLanguage = languages.find((x) => x.lang === lang);
  return (
    <Dropdown drop="down" alignRight>
      <Dropdown.Toggle
        as={DropdownTopbarItemToggler}
        id="dropdown-toggle-my-cart"
      >
        <OverlayTrigger
          placement="bottom"
          overlay={
            <Tooltip id="language-panel-tooltip">{formatMessage({ defaultMessage: 'Thay đổi ngôn ngữ' })}</Tooltip>
          }
        >
          <div className="btn-dropdown d-flex align-items-center cursor-pointer">
            <div className={showName ? `mr-3` : `btn-clean btn-lg mr-1`}>
              <img
                className="h-25px w-25px rounded"
                src={currentLanguage?.flag}
                alt={currentLanguage?.name}
              />
            </div>
            {showName && <span className="d-flex align-items-center">
              <span className="mr-2">
                {currentLanguage?.name}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
              </svg>
            </span>
            }
          </div>
        </OverlayTrigger>
      </Dropdown.Toggle>
      <Dropdown.Menu className="p-0 m-0 dropdown-menu-right dropdown-menu-anim dropdown-menu-top-unround">
        <ul className="navi navi-hover py-4">
          {languages.map((language) => (
            <li
              key={language.lang}
              className={clsx("navi-item", {
                active: language.lang === currentLanguage.lang,
              })}
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();

                  if (language.lang === currentLanguage.lang) {
                    document.body.click();
                    return
                  };
                  setLanguage(language.lang)
                }}
                className="navi-link"
              >
                <span className="symbol symbol-20 mr-3">
                  <img src={language.flag} alt={language.name} />
                </span>
                <span className="navi-text">{language.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </Dropdown.Menu>
    </Dropdown>
  );
}
