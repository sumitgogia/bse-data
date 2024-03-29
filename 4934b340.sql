SELECT
    SCRIP_CD,
    SLONGNAME as Company,
    "<a href='" || case
        when NSURL is null
        or NSURL = "" then "https://www.bseindia.com/stock-share-price/company/name/" || SCRIP_CD
        else NSURL
    end || "' target='_blank'>" || case
        when SLONGNAME is null
        or SLONGNAME = "" then SCRIP_CD
        else SLONGNAME
    end || "</a>" as CompanyLink,
    case
        when ATTACHMENTNAME is null
        or ATTACHMENTNAME = "" then NEWSSUB
        else "<a href='https://www.bseindia.com/xml-data/corpfiling/AttachLive/" || ATTACHMENTNAME || "' target='_blank'>" || NEWSSUB || "</a>"
    end || case
        when MORE is null
        or MORE = "" then "\n" || coalesce(HEADLINE, "")
        else "\n" || coalesce(MORE, "")
    end || "\n ddt{{" || DissemDT || "}}" as Announcement,
    unixepoch(DissemDT) as DisseminatedDT
FROM
    {{tableName}}
WHERE
    SCRIP_CD is not null {{conditions}}
ORDER BY
    SCRIP_CD asc,
    DisseminatedDT asc